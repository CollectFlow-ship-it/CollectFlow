"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/company";
import { validateImportRows } from "@/lib/csv";
import { UUID_RE } from "@/lib/invoices";

export type ImportResult =
  | { ok: true; inserted: number; skipped: number }
  | { ok: false; error: string };

export async function importInvoices(input: unknown): Promise<ImportResult> {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const checked = validateImportRows(input);
  if (!checked.ok) return { ok: false, error: checked.error };

  const payload = checked.rows.map((r) => ({ ...r, company_id: company.id }));

  const supabase = createClient();
  // Les numéros de facture déjà connus sont ignorés : on peut réimporter
  // un fichier sans créer de doublons.
  const { data, error } = await supabase
    .from("invoices")
    .upsert(payload, {
      onConflict: "company_id,invoice_number",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    return {
      ok: false,
      error: "L'enregistrement a échoué. Vérifiez votre connexion et réessayez.",
    };
  }

  const inserted = data?.length ?? 0;
  revalidatePath("/app/invoices");
  revalidatePath("/app");
  return { ok: true, inserted, skipped: payload.length - inserted };
}

async function updateInvoice(
  formData: FormData,
  changes: Record<string, unknown>,
) {
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return;

  const company = await getCompany();
  if (!company) return;

  const supabase = createClient();
  await supabase
    .from("invoices")
    .update(changes)
    .eq("id", id)
    .eq("company_id", company.id);

  revalidatePath("/app/invoices");
  revalidatePath("/app");
}

export async function setPaused(formData: FormData) {
  const paused = String(formData.get("paused") ?? "") === "true";
  await updateInvoice(formData, { paused });
}

export async function markPaid(formData: FormData) {
  await updateInvoice(formData, {
    status: "paid",
    paid_at: new Date().toISOString(),
  });
}

export async function markUnpaid(formData: FormData) {
  await updateInvoice(formData, { status: "unpaid", paid_at: null });
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return;

  const company = await getCompany();
  if (!company) return;

  const supabase = createClient();
  await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("company_id", company.id);

  revalidatePath("/app/invoices");
  revalidatePath("/app");
}
