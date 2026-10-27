"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/company";
import { UUID_RE } from "@/lib/invoices";
import {
  checkStep,
  DEFAULT_STEPS,
  MAX_PAYMENT_INSTRUCTIONS,
  TONES,
  type StepInput,
  type Tone,
} from "@/lib/templates";

function back(params: Record<string, string>, anchor?: string): never {
  const qs = new URLSearchParams(params).toString();
  redirect(`/app/scenarios?${qs}${anchor ? `#${anchor}` : ""}`);
}

function readStep(formData: FormData): StepInput {
  const tone = String(formData.get("tone") ?? "");
  return {
    days_after_due: Number(String(formData.get("days_after_due") ?? "").trim()),
    tone: (TONES.some((t) => t.key === tone) ? tone : "formel") as Tone,
    subject: String(formData.get("subject") ?? "").trim(),
    body: String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim(),
    enabled: formData.get("enabled") === "on",
    formal_notice: formData.get("formal_notice") === "on",
  };
}

function dbError(code: string | undefined, days: number): string {
  if (code === "23505") {
    return `Une étape existe déjà à J${days >= 0 ? "+" : ""}${days}. Choisissez un autre délai.`;
  }
  return "L'enregistrement a échoué. Réessayez dans un instant.";
}

export async function saveStep(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) back({ error: "Étape introuvable." });

  const step = readStep(formData);
  const problem = checkStep(step);
  if (problem) back({ error: problem, step: id }, `step-${id}`);

  const company = await getCompany();
  if (!company) back({ error: "Session expirée. Reconnectez-vous." });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminder_steps")
    .update(step)
    .eq("id", id)
    .eq("company_id", company!.id)
    .select("id");

  if (error) back({ error: dbError(error.code, step.days_after_due), step: id }, `step-${id}`);
  if (!data || data.length === 0) back({ error: "Étape introuvable." });

  revalidatePath("/app/scenarios");
  back({ saved: id }, `step-${id}`);
}

export async function addStep(formData: FormData) {
  const days = Number(String(formData.get("days_after_due") ?? "").trim());
  const base = DEFAULT_STEPS[1];
  const step: StepInput = { ...base, days_after_due: days };
  const problem = checkStep(step);
  if (problem) back({ error: problem });

  const company = await getCompany();
  if (!company) back({ error: "Session expirée. Reconnectez-vous." });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminder_steps")
    .insert({ ...step, company_id: company!.id })
    .select("id")
    .single();

  if (error || !data) back({ error: dbError(error?.code, days) });

  revalidatePath("/app/scenarios");
  const newId = (data as { id: string }).id;
  back({ saved: newId }, `step-${newId}`);
}

export async function deleteStep(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) back({ error: "Étape introuvable." });

  const company = await getCompany();
  if (!company) back({ error: "Session expirée. Reconnectez-vous." });

  const supabase = createClient();
  const { error } = await supabase
    .from("reminder_steps")
    .delete()
    .eq("id", id)
    .eq("company_id", company!.id);

  if (error) back({ error: "La suppression a échoué. Réessayez dans un instant." });

  revalidatePath("/app/scenarios");
  back({ deleted: "1" });
}

export async function saveSettings(formData: FormData) {
  const rate = Number(String(formData.get("penalty_rate") ?? "").replace(",", ".").trim());
  const feeEuros = Number(String(formData.get("fixed_fee") ?? "").replace(",", ".").trim());
  const instructions = String(formData.get("payment_instructions") ?? "")
    .replace(/\r\n/g, "\n")
    .trim();

  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    back({ error: "Le taux de pénalités doit être compris entre 0 et 100 %.", settings: "1" }, "reglages");
  }
  if (!Number.isFinite(feeEuros) || feeEuros < 0 || feeEuros > 1000) {
    back({ error: "L'indemnité forfaitaire doit être comprise entre 0 et 1 000 €.", settings: "1" }, "reglages");
  }
  const replyTo = String(formData.get("reply_to_email") ?? "").trim().toLowerCase();
  if (replyTo !== "" && (replyTo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo))) {
    back({ error: "L'adresse e-mail de réponse n'est pas valide.", settings: "1" }, "reglages");
  }
  if (instructions.length > MAX_PAYMENT_INSTRUCTIONS) {
    back(
      { error: `Les instructions de paiement sont limitées à ${MAX_PAYMENT_INSTRUCTIONS} caractères.`, settings: "1" },
      "reglages",
    );
  }

  const company = await getCompany();
  if (!company) back({ error: "Session expirée. Reconnectez-vous." });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .update({
      penalty_rate: Math.round(rate * 100) / 100,
      fixed_fee_cents: Math.round(feeEuros * 100),
      payment_instructions: instructions,
      reply_to_email: replyTo === "" ? null : replyTo,
    })
    .eq("id", company!.id)
    .select("id");

  if (error || !data || data.length === 0) {
    back(
      { error: "L'enregistrement a échoué. Seul le propriétaire du compte peut modifier ces réglages.", settings: "1" },
      "reglages",
    );
  }

  revalidatePath("/app/scenarios");
  back({ settings_saved: "1" }, "reglages");
}
