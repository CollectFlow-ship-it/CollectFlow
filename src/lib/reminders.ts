// Quelles relances sont dues, et à quoi ressemble le message envoyé.
// Fichier sans dépendance externe, utilisable côté serveur et dans les tests.

import { daysLate } from "./invoices";
import { buildVars, fillTemplate } from "./templates";

// Colonnes lues en base pour calculer les relances dues.
export const INVOICE_COLUMNS =
  "id, client_name, client_email, invoice_number, amount_cents, due_date, status, paused";
export const STEP_COLUMNS = "id, days_after_due, tone, subject, body, enabled, formal_notice";

export type StepRow = {
  id: string;
  days_after_due: number;
  tone: string;
  subject: string;
  body: string;
  enabled: boolean;
  formal_notice: boolean;
};

export type InvoiceRow = {
  id: string;
  client_name: string;
  client_email: string;
  invoice_number: string;
  amount_cents: number;
  due_date: string;
  status: string;
  paused: boolean;
};

export type RecordRow = {
  invoice_id: string;
  step_id: string | null;
  status: string;
};

export type MessageSettings = {
  company_name: string;
  penalty_rate: number;
  fixed_fee_cents: number;
  payment_instructions: string;
};

export type DueItem = {
  invoice: InvoiceRow;
  step: StepRow;
  late: number;
  retry: boolean; // un envoi précédent a échoué
};

// Un envoi déjà fait, ignoré, traité à la main ou en cours ne revient pas.
const HANDLED = new Set(["sent", "manual", "skipped", "sending"]);

// Pour chaque facture impayée et non mise en pause, une seule relance est due :
// la dernière étape active dont le délai est atteint. Une facture importée avec
// 40 jours de retard reçoit donc l'étape la plus avancée, pas toute la série.
export function computeDue(
  invoices: InvoiceRow[],
  steps: StepRow[],
  records: RecordRow[],
  today: string,
): DueItem[] {
  const active = steps
    .filter((s) => s.enabled)
    .sort((a, b) => a.days_after_due - b.days_after_due);

  const byInvoice = new Map<string, RecordRow[]>();
  for (const r of records) {
    const list = byInvoice.get(r.invoice_id);
    if (list) list.push(r);
    else byInvoice.set(r.invoice_id, [r]);
  }

  const out: DueItem[] = [];
  for (const invoice of invoices) {
    if (invoice.status !== "unpaid" || invoice.paused) continue;
    const late = daysLate(invoice.due_date, today);
    const reached = active.filter((s) => s.days_after_due <= late);
    if (reached.length === 0) continue;

    const step = reached[reached.length - 1];
    const rec = (byInvoice.get(invoice.id) ?? []).find((r) => r.step_id === step.id);
    if (rec && HANDLED.has(rec.status)) continue;

    out.push({ invoice, step, late, retry: !!rec });
  }

  return out.sort((a, b) => b.late - a.late || a.invoice.client_name.localeCompare(b.invoice.client_name));
}

export type RenderedMessage = { to: string; subject: string; body: string };

export function renderReminder(
  invoice: InvoiceRow,
  step: StepRow,
  late: number,
  settings: MessageSettings,
): RenderedMessage {
  const vars = buildVars({
    client_name: invoice.client_name,
    invoice_number: invoice.invoice_number,
    amount_cents: invoice.amount_cents,
    due_date: invoice.due_date,
    late_days: late,
    company_name: settings.company_name,
    penalty_rate: settings.penalty_rate,
    fixed_fee_cents: settings.fixed_fee_cents,
    payment_instructions: settings.payment_instructions,
  });

  return {
    to: invoice.client_email,
    // Jamais de saut de ligne dans l'objet, même si un nom de client en contient.
    subject: fillTemplate(step.subject, vars).replace(/[\r\n]+/g, " ").trim(),
    // Une variable vide (instructions de paiement) ne doit pas laisser de trous.
    body: fillTemplate(step.body, vars).replace(/\n{3,}/g, "\n\n").trim(),
  };
}
