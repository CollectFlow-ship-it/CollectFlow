// E-mail de récapitulatif quotidien : « N relances à valider ».
// Fichier sans dépendance externe, utilisable côté serveur et dans les tests.

import { formatEur } from "./invoices";
import { toneLabel } from "./templates";
import type { DueItem } from "./reminders";

const MAX_LINES = 15;

// Adresse publique du site, utilisée pour les liens du message.
export function appUrl(): string {
  const raw = (process.env.APP_URL || "https://www.collectflow.fr").trim();
  return raw.replace(/\/+$/, "");
}

// Les noms viennent de fichiers importés : une seule ligne, longueur limitée.
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

function plural(n: number, one: string, many: string): string {
  return n > 1 ? many : one;
}

// Libellés accordés avec « relance » (le nom des tons est au masculin).
const WHAT: Record<string, string> = {
  amical: "relance amicale",
  formel: "relance formelle",
  ferme: "relance ferme",
  mise_en_demeure: "mise en demeure",
};

function describe(item: DueItem): string {
  const { invoice, step, late } = item;
  const what = step.formal_notice
    ? "mise en demeure, courrier recommandé à poster"
    : (WHAT[step.tone] ?? `relance ${toneLabel(step.tone).toLowerCase()}`);
  const retry = item.retry ? " (le dernier envoi a échoué)" : "";
  return (
    `- ${oneLine(invoice.client_name)}, facture ${oneLine(invoice.invoice_number)}, ` +
    `${formatEur(invoice.amount_cents)}, ${late} ${plural(late, "jour", "jours")} de retard : ${what}${retry}`
  );
}

export function buildDigest(input: {
  companyName: string;
  items: DueItem[];
  example?: boolean;
}): { subject: string; text: string } {
  const n = input.items.length;
  const total = input.items.reduce((sum, i) => sum + i.invoice.amount_cents, 0);
  const url = appUrl();

  const shown = input.items.slice(0, MAX_LINES).map(describe);
  const hidden = n - shown.length;

  const lines: string[] = [];
  if (input.example) {
    lines.push(
      "Ceci est un exemple : aucune relance n'est due pour le moment. Le vrai récapitulatif",
      "ressemblera à ce message avec vos factures.",
      "",
    );
  }
  lines.push(
    "Bonjour,",
    "",
    `${n} ${plural(n, "relance est prête", "relances sont prêtes")} à partir pour ${oneLine(input.companyName)} ` +
      `(${formatEur(total)} en attente) :`,
    "",
    ...shown,
  );
  if (hidden > 0) lines.push(`- … et ${hidden} ${plural(hidden, "autre", "autres")}`);
  lines.push(
    "",
    "Rien n'est envoyé sans votre accord. Relisez et validez ici :",
    `${url}/app/reminders`,
    "",
    "Vous ne souhaitez plus recevoir ce récapitulatif ? Vous pouvez le désactiver dans les réglages :",
    `${url}/app/scenarios#reglages`,
    "",
    "CollectFlow",
  );

  return {
    subject: `${n} ${plural(n, "relance à valider", "relances à valider")}`,
    text: lines.join("\n"),
  };
}
