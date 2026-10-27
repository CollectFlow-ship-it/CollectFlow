export type Invoice = {
  id: string;
  client_name: string;
  client_email: string;
  invoice_number: string;
  amount_cents: number;
  due_date: string; // aaaa-mm-jj
  status: "unpaid" | "paid";
  paused: boolean;
  paid_at: string | null;
};

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(cents: number): string {
  return eur.format(cents / 100);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Date du jour en France, au format aaaa-mm-jj.
export function todayParis(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

// Ajoute (ou retire, si négatif) des jours à une date aaaa-mm-jj.
export function addDays(iso: string, n: number): string {
  const d = new Date((dayNumber(iso) + n) * 86_400_000);
  return d.toISOString().slice(0, 10);
}

// Positif = jours de retard, négatif = jours avant l'échéance.
export function daysLate(dueIso: string, todayIso: string): number {
  return dayNumber(todayIso) - dayNumber(dueIso);
}

export type Severity = "notdue" | "light" | "medium" | "critical";

export function severity(late: number): Severity {
  if (late <= 0) return "notdue";
  if (late <= 10) return "light";
  if (late <= 30) return "medium";
  return "critical";
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
