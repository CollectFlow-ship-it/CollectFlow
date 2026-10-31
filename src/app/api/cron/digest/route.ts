import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigured, sendEmail } from "@/lib/email";
import { buildDigest } from "@/lib/digest";
import { todayParis } from "@/lib/invoices";
import {
  computeDue,
  INVOICE_COLUMNS,
  STEP_COLUMNS,
  type InvoiceRow,
  type RecordRow,
  type StepRow,
} from "@/lib/reminders";

// Appelée chaque matin en semaine par Vercel (voir vercel.json).
// Elle n'envoie rien aux clients : elle prévient seulement le propriétaire
// du compte qu'il a des relances à valider.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_COMPANIES = 200;
const PAUSE_BETWEEN_COMPANIES_MS = 300;

// Vercel envoie « Authorization: Bearer <CRON_SECRET> ». Sans secret défini
// (ou trop court), la route refuse tout : jamais d'accès ouvert par défaut.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    console.log("[digest] refusé : CRON_SECRET absent, trop court ou différent de celui reçu.");
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ error: "L'envoi d'e-mails n'est pas configuré." }, { status: 500 });
  }
  const admin = createAdminClient();
  if (!admin) {
    console.log("[digest] erreur : SUPABASE_SERVICE_ROLE_KEY n'est pas définie.");
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY n'est pas définie." },
      { status: 500 },
    );
  }

  const today = todayParis();

  const { data: companies, error } = await admin
    .from("companies")
    .select("id, name")
    .eq("digest_enabled", true)
    .or(`last_digest_on.is.null,last_digest_on.lt.${today}`)
    .limit(MAX_COMPANIES);
  if (error) {
    console.log("[digest] erreur de lecture des entreprises : migration 0005 manquante ?");
    return NextResponse.json(
      { error: "Lecture des entreprises impossible. La migration 0005 a-t-elle été exécutée ?" },
      { status: 500 },
    );
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const company of companies ?? []) {
    const id = company.id as string;
    const name = String(company.name ?? "");

    const [inv, steps, recs, owner] = await Promise.all([
      admin
        .from("invoices")
        .select(INVOICE_COLUMNS)
        .eq("company_id", id)
        .eq("status", "unpaid")
        .limit(1000),
      admin.from("reminder_steps").select(STEP_COLUMNS).eq("company_id", id),
      admin.from("reminders").select("invoice_id, step_id, status").eq("company_id", id).limit(5000),
      admin.from("memberships").select("user_id").eq("company_id", id).eq("role", "owner").limit(1),
    ]);
    if (inv.error || steps.error || recs.error || owner.error) {
      failed++;
      continue;
    }

    const invoices = ((inv.data ?? []) as InvoiceRow[]).map((i) => ({
      ...i,
      amount_cents: Number(i.amount_cents),
    }));
    const items = computeDue(
      invoices,
      (steps.data ?? []) as StepRow[],
      (recs.data ?? []) as RecordRow[],
      today,
    );
    if (items.length === 0) {
      skipped++;
      continue;
    }

    const userId = (owner.data?.[0]?.user_id as string | undefined) ?? "";
    const user = userId ? await admin.auth.admin.getUserById(userId) : null;
    const to = user?.data.user?.email;
    if (!to) {
      failed++;
      continue;
    }

    const { subject, text } = buildDigest({ companyName: name, items });
    const res = await sendEmail({
      companyName: name,
      fromName: "CollectFlow",
      to,
      subject,
      text,
      // Même clé toute la journée : si la tâche tourne deux fois, un seul e-mail part.
      idempotencyKey: `digest:${id}:${today}`,
    });

    if (!res.ok) {
      failed++;
      continue;
    }
    sent++;
    await admin.from("companies").update({ last_digest_on: today }).eq("id", id);
    await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_COMPANIES_MS));
  }

  const summary = { date: today, checked: companies?.length ?? 0, sent, skipped, failed };
  // Visible dans Vercel, onglet Logs : permet de vérifier la tâche sans ouvrir de boîte mail.
  console.log(`[digest] ${JSON.stringify(summary)}`);
  return NextResponse.json(summary);
}
