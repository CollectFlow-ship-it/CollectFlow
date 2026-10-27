"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/company";
import { todayParis, UUID_RE } from "@/lib/invoices";
import { emailConfigured, sendEmail } from "@/lib/email";
import {
  computeDue,
  renderReminder,
  type DueItem,
  type InvoiceRow,
  type MessageSettings,
  type RecordRow,
  type RenderedMessage,
  type StepRow,
} from "@/lib/reminders";

const MAX_BATCH = 10;
const PAUSE_BETWEEN_SENDS_MS = 600;
const STALE_SENDING_MS = 10 * 60 * 1000;

const INVOICE_COLUMNS =
  "id, client_name, client_email, invoice_number, amount_cents, due_date, status, paused";
const STEP_COLUMNS = "id, days_after_due, tone, subject, body, enabled, formal_notice";

type Supabase = ReturnType<typeof createClient>;

type Ctx = {
  supabase: Supabase;
  companyId: string;
  settings: MessageSettings;
  replyTo: string | null;
  steps: StepRow[];
};

function back(params: Record<string, string>): never {
  redirect(`/app/reminders?${new URLSearchParams(params).toString()}`);
}

async function loadContext(): Promise<Ctx | null> {
  const company = await getCompany();
  if (!company) return null;

  const supabase = createClient();
  const { data: cs } = await supabase
    .from("companies")
    .select("penalty_rate, fixed_fee_cents, payment_instructions, reply_to_email")
    .eq("id", company.id)
    .maybeSingle();
  const { data: steps } = await supabase
    .from("reminder_steps")
    .select(STEP_COLUMNS)
    .eq("company_id", company.id);

  if (!cs || !steps) return null;

  return {
    supabase,
    companyId: company.id,
    settings: {
      company_name: company.name,
      penalty_rate: Number(cs.penalty_rate),
      fixed_fee_cents: Number(cs.fixed_fee_cents),
      payment_instructions: String(cs.payment_instructions ?? ""),
    },
    replyTo: (cs.reply_to_email as string | null) ?? null,
    steps: steps as StepRow[],
  };
}

// Relances dues, recalculées ici à partir de la base : on ne fait jamais
// confiance à ce que le navigateur affirme être « dû ».
async function loadDue(ctx: Ctx, invoiceId?: string): Promise<DueItem[]> {
  let invQuery = ctx.supabase
    .from("invoices")
    .select(INVOICE_COLUMNS)
    .eq("company_id", ctx.companyId)
    .eq("status", "unpaid")
    .limit(1000);
  let recQuery = ctx.supabase
    .from("reminders")
    .select("invoice_id, step_id, status")
    .eq("company_id", ctx.companyId)
    .limit(5000);
  if (invoiceId) {
    invQuery = invQuery.eq("id", invoiceId);
    recQuery = recQuery.eq("invoice_id", invoiceId);
  }

  const [inv, rec] = await Promise.all([invQuery, recQuery]);
  if (inv.error || rec.error) return [];

  const invoices = ((inv.data ?? []) as InvoiceRow[]).map((i) => ({
    ...i,
    amount_cents: Number(i.amount_cents),
  }));
  return computeDue(invoices, ctx.steps, (rec.data ?? []) as RecordRow[], todayParis());
}

function precondition(ctx: Ctx): string | null {
  if (!emailConfigured()) {
    return "L'envoi d'e-mails n'est pas encore activé : ajoutez la clé Resend dans Vercel (voir SETUP.md).";
  }
  if (!ctx.replyTo) {
    return "Renseignez d'abord votre adresse e-mail de réponse (Scénarios, puis Réglages).";
  }
  return null;
}

function recordRow(ctx: Ctx, item: DueItem, msg: RenderedMessage, status: string) {
  return {
    company_id: ctx.companyId,
    invoice_id: item.invoice.id,
    step_id: item.step.id,
    step_days: item.step.days_after_due,
    tone: item.step.tone,
    to_email: msg.to,
    subject: msg.subject,
    body: msg.body,
    status,
  };
}

// Réserve la relance dans le journal avant d'envoyer. Si une ligne existe déjà,
// on ne la reprend que si l'envoi précédent a échoué (ou est resté bloqué).
async function claim(
  ctx: Ctx,
  item: DueItem,
  msg: RenderedMessage,
): Promise<{ id: string; attempts: number } | null> {
  const ins = await ctx.supabase
    .from("reminders")
    .insert(recordRow(ctx, item, msg, "sending"))
    .select("id, attempts")
    .single();
  if (!ins.error && ins.data) {
    return { id: ins.data.id as string, attempts: Number(ins.data.attempts) };
  }
  if (ins.error?.code !== "23505") return null;

  const { data: existing } = await ctx.supabase
    .from("reminders")
    .select("id, status, attempts, updated_at")
    .eq("invoice_id", item.invoice.id)
    .eq("step_id", item.step.id)
    .maybeSingle();
  if (!existing) return null;

  const stuck =
    existing.status === "sending" &&
    Date.now() - Date.parse(existing.updated_at as string) > STALE_SENDING_MS;
  if (existing.status !== "failed" && !stuck) return null;

  const attempts = Number(existing.attempts) + 1;
  const upd = await ctx.supabase
    .from("reminders")
    .update({
      status: "sending",
      attempts,
      error: null,
      to_email: msg.to,
      subject: msg.subject,
      body: msg.body,
      step_days: item.step.days_after_due,
      tone: item.step.tone,
    })
    .eq("id", existing.id as string)
    .eq("status", existing.status as string)
    .eq("attempts", Number(existing.attempts))
    .select("id");
  if (upd.error || !upd.data || upd.data.length === 0) return null;
  return { id: existing.id as string, attempts };
}

async function sendItem(ctx: Ctx, item: DueItem): Promise<{ ok: boolean; message: string }> {
  if (item.step.formal_notice) {
    return {
      ok: false,
      message: "Une mise en demeure s'envoie par courrier recommandé, pas par e-mail.",
    };
  }

  const msg = renderReminder(item.invoice, item.step, item.late, ctx.settings);
  const claimed = await claim(ctx, item, msg);
  if (!claimed) return { ok: false, message: "Cette relance a déjà été traitée." };

  const res = await sendEmail({
    companyName: ctx.settings.company_name,
    to: msg.to,
    replyTo: ctx.replyTo as string,
    subject: msg.subject,
    text: msg.body,
    idempotencyKey: `${item.invoice.id}:${item.step.id}:${claimed.attempts}`,
  });

  if (res.ok) {
    await ctx.supabase
      .from("reminders")
      .update({ status: "sent", provider_id: res.id, sent_at: new Date().toISOString(), error: null })
      .eq("id", claimed.id);
    return { ok: true, message: "Relance envoyée." };
  }

  const uncertain = res.error.includes("pas répondu");
  await ctx.supabase
    .from("reminders")
    .update({
      status: "failed",
      error: uncertain
        ? `${res.error} L'e-mail est peut-être parti : vérifiez avant de réessayer.`
        : res.error,
    })
    .eq("id", claimed.id);
  return { ok: false, message: res.error };
}

function readIds(formData: FormData): { invoiceId: string; stepId: string } | null {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const stepId = String(formData.get("step_id") ?? "");
  if (!UUID_RE.test(invoiceId) || !UUID_RE.test(stepId)) return null;
  return { invoiceId, stepId };
}

async function findItem(ctx: Ctx, invoiceId: string, stepId: string): Promise<DueItem | null> {
  const items = await loadDue(ctx, invoiceId);
  return items.find((i) => i.step.id === stepId) ?? null;
}

export async function sendReminder(formData: FormData) {
  const ids = readIds(formData);
  if (!ids) back({ error: "Relance introuvable." });

  const ctx = await loadContext();
  if (!ctx) back({ error: "Session expirée. Reconnectez-vous." });

  const blocked = precondition(ctx!);
  if (blocked) back({ error: blocked });

  const item = await findItem(ctx!, ids!.invoiceId, ids!.stepId);
  if (!item) back({ error: "Cette relance n'est plus d'actualité (facture payée, en pause ou déjà traitée)." });

  const result = await sendItem(ctx!, item!);
  revalidatePath("/app/reminders");
  if (!result.ok) back({ error: result.message });
  back({ sent: "1" });
}

export async function sendAll() {
  const ctx = await loadContext();
  if (!ctx) back({ error: "Session expirée. Reconnectez-vous." });

  const blocked = precondition(ctx!);
  if (blocked) back({ error: blocked });

  const items = (await loadDue(ctx!)).filter((i) => !i.step.formal_notice).slice(0, MAX_BATCH);
  if (items.length === 0) back({ error: "Aucune relance à envoyer." });

  let sent = 0;
  let failed = 0;
  let lastError = "";
  for (let n = 0; n < items.length; n++) {
    if (n > 0) await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_SENDS_MS));
    const result = await sendItem(ctx!, items[n]);
    if (result.ok) sent++;
    else {
      failed++;
      lastError = result.message;
    }
  }

  revalidatePath("/app/reminders");
  back(
    failed > 0
      ? { sent: String(sent), failed: String(failed), error: lastError }
      : { sent: String(sent) },
  );
}

async function markItem(formData: FormData, status: "skipped" | "manual") {
  const ids = readIds(formData);
  if (!ids) back({ error: "Relance introuvable." });

  const ctx = await loadContext();
  if (!ctx) back({ error: "Session expirée. Reconnectez-vous." });

  const item = await findItem(ctx!, ids!.invoiceId, ids!.stepId);
  if (!item) back({ error: "Cette relance n'est plus d'actualité." });

  const msg = renderReminder(item!.invoice, item!.step, item!.late, ctx!.settings);
  const row = { ...recordRow(ctx!, item!, msg, status), sent_at: new Date().toISOString() };

  if (item!.retry) {
    // Une ligne « échec » existe : on la remplace plutôt que d'en créer une seconde.
    await ctx!.supabase
      .from("reminders")
      .update({ status, error: null, sent_at: row.sent_at })
      .eq("invoice_id", item!.invoice.id)
      .eq("step_id", item!.step.id)
      .eq("status", "failed");
  } else {
    const ins = await ctx!.supabase.from("reminders").insert(row);
    if (ins.error && ins.error.code !== "23505") {
      back({ error: "L'enregistrement a échoué. Réessayez dans un instant." });
    }
  }

  revalidatePath("/app/reminders");
  back({ [status]: "1" });
}

export async function skipReminder(formData: FormData) {
  await markItem(formData, "skipped");
}

export async function markLetterSent(formData: FormData) {
  await markItem(formData, "manual");
}

// Envoie un exemple réel à l'adresse du compte connecté. Rien n'est enregistré
// dans le journal et aucun client n'est contacté.
export async function sendTest() {
  const ctx = await loadContext();
  if (!ctx) back({ error: "Session expirée. Reconnectez-vous." });

  const blocked = precondition(ctx!);
  if (blocked) back({ error: blocked });

  const {
    data: { user },
  } = await ctx!.supabase.auth.getUser();
  if (!user?.email) back({ error: "Adresse e-mail du compte introuvable." });

  const items = (await loadDue(ctx!)).filter((i) => !i.step.formal_notice);
  const item = items[0];
  const msg = item
    ? renderReminder(item.invoice, item.step, item.late, ctx!.settings)
    : renderReminder(
        {
          id: "test",
          client_name: "Exemple SARL",
          client_email: user!.email as string,
          invoice_number: "F-2026-0001",
          amount_cents: 120000,
          due_date: todayParis(),
          status: "unpaid",
          paused: false,
        },
        ctx!.steps.find((s) => s.enabled && !s.formal_notice) ?? {
          id: "test",
          days_after_due: 3,
          tone: "amical",
          subject: "Petit rappel : facture {numero_facture}",
          body: "Bonjour {nom_client},\n\nCeci est un e-mail de test.\n\n{nom_entreprise}",
          enabled: true,
          formal_notice: false,
        },
        3,
        ctx!.settings,
      );

  const res = await sendEmail({
    companyName: ctx!.settings.company_name,
    to: user!.email as string,
    replyTo: ctx!.replyTo as string,
    subject: `[TEST] ${msg.subject}`,
    text: msg.body,
    idempotencyKey: `test:${crypto.randomUUID()}`,
  });

  if (!res.ok) back({ error: res.error });
  back({ test: user!.email as string });
}
