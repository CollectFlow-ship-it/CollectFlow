// Modèles d'e-mails de relance : variables, pénalités, validation.
// Fichier sans dépendance externe : il sert dans le navigateur (aperçu en
// direct) et sur le serveur (validation avant enregistrement et, plus tard,
// avant envoi).

import { formatDate, formatEur } from "./invoices";

export const TONES = [
  { key: "amical", label: "Amical" },
  { key: "formel", label: "Formel" },
  { key: "ferme", label: "Ferme" },
  { key: "mise_en_demeure", label: "Mise en demeure" },
] as const;

export type Tone = (typeof TONES)[number]["key"];

export function toneLabel(tone: string): string {
  return TONES.find((t) => t.key === tone)?.label ?? tone;
}

export const VARIABLES = [
  { key: "nom_client", label: "Nom du client" },
  { key: "montant", label: "Montant de la facture" },
  { key: "numero_facture", label: "Numéro de facture" },
  { key: "date_echeance", label: "Date d'échéance" },
  { key: "jours_retard", label: "Jours de retard" },
  { key: "penalites", label: "Pénalités + indemnité de recouvrement" },
  { key: "instructions_paiement", label: "Vos instructions de paiement" },
  { key: "nom_entreprise", label: "Nom de votre entreprise" },
] as const;

const VARIABLE_KEYS: readonly string[] = VARIABLES.map((v) => v.key);

export const MIN_DAYS = -30;
export const MAX_DAYS = 180;
export const MAX_SUBJECT = 200;
export const MAX_BODY = 5000;
export const MAX_PAYMENT_INSTRUCTIONS = 600;

export type StepInput = {
  days_after_due: number;
  tone: Tone;
  subject: string;
  body: string;
  enabled: boolean;
  formal_notice: boolean;
};

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  );
}

// Variables écrites dans le texte mais qui n'existent pas (faute de frappe).
export function unknownVariables(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\{(\w+)\}/g)) {
    if (!VARIABLE_KEYS.includes(m[1])) found.add(m[1]);
  }
  return Array.from(found);
}

// Pénalités de retard = montant x taux annuel x jours / 365, plus l'indemnité
// forfaitaire de recouvrement. Tout en centimes, arrondi au centime.
export function computePenaltyCents(
  amountCents: number,
  lateDays: number,
  ratePercent: number,
  fixedFeeCents: number,
): number {
  const days = Math.max(lateDays, 0);
  const interest = Math.round(((amountCents * ratePercent) / 100) * (days / 365));
  return interest + fixedFeeCents;
}

export type VarsInput = {
  client_name: string;
  invoice_number: string;
  amount_cents: number;
  due_date: string;
  late_days: number;
  company_name: string;
  penalty_rate: number;
  fixed_fee_cents: number;
  payment_instructions: string;
};

export function buildVars(i: VarsInput): Record<string, string> {
  return {
    nom_client: i.client_name,
    montant: formatEur(i.amount_cents),
    numero_facture: i.invoice_number,
    date_echeance: formatDate(i.due_date),
    jours_retard: String(Math.max(i.late_days, 0)),
    penalites: formatEur(
      computePenaltyCents(i.amount_cents, i.late_days, i.penalty_rate, i.fixed_fee_cents),
    ),
    instructions_paiement: i.payment_instructions,
    nom_entreprise: i.company_name,
  };
}

// Règles communes à l'enregistrement d'une étape. Renvoie un message ou null.
export function checkStep(s: StepInput): string | null {
  if (!Number.isInteger(s.days_after_due) || s.days_after_due < MIN_DAYS || s.days_after_due > MAX_DAYS) {
    return `Le délai doit être un nombre entier de jours entre ${MIN_DAYS} et ${MAX_DAYS}.`;
  }
  if (!TONES.some((t) => t.key === s.tone)) return "Ton inconnu.";
  if (s.subject.length < 1 || s.subject.length > MAX_SUBJECT || /[\r\n]/.test(s.subject)) {
    return `L'objet est obligatoire, sur une seule ligne, ${MAX_SUBJECT} caractères maximum.`;
  }
  if (s.body.length < 1 || s.body.length > MAX_BODY) {
    return `Le message est obligatoire, ${MAX_BODY} caractères maximum.`;
  }
  const unknown = unknownVariables(s.subject + "\n" + s.body);
  if (unknown.length > 0) {
    return `Variable inconnue : {${unknown[0]}}. Utilisez les boutons de variables pour éviter les fautes de frappe.`;
  }
  return null;
}

// Scénario proposé à la première visite. Modifiable ensuite, étape par étape.
export const DEFAULT_STEPS: StepInput[] = [
  {
    days_after_due: 3,
    tone: "amical",
    enabled: true,
    formal_notice: false,
    subject: "Petit rappel : facture {numero_facture}",
    body:
      "Bonjour {nom_client},\n\n" +
      "Sauf erreur de notre part, la facture {numero_facture} de {montant}, échue le {date_echeance}, n'a pas encore été réglée.\n\n" +
      "{instructions_paiement}\n\n" +
      "Si le paiement est déjà parti, merci d'ignorer ce message.\n\n" +
      "Bien cordialement,\n{nom_entreprise}",
  },
  {
    days_after_due: 10,
    tone: "formel",
    enabled: true,
    formal_notice: false,
    subject: "Facture {numero_facture} en retard de {jours_retard} jours",
    body:
      "Bonjour {nom_client},\n\n" +
      "Nous n'avons toujours pas reçu le règlement de la facture {numero_facture} ({montant}), échue depuis le {date_echeance}.\n\n" +
      "Nous vous remercions de procéder au paiement dans les meilleurs délais.\n{instructions_paiement}\n\n" +
      "Si un point bloque, répondez simplement à ce message et nous trouverons une solution ensemble.\n\n" +
      "Cordialement,\n{nom_entreprise}",
  },
  {
    days_after_due: 20,
    tone: "ferme",
    enabled: true,
    formal_notice: false,
    subject: "Dernier rappel avant mise en demeure : facture {numero_facture}",
    body:
      "Bonjour {nom_client},\n\n" +
      "Malgré nos relances, la facture {numero_facture} de {montant} reste impayée, {jours_retard} jours après son échéance du {date_echeance}.\n\n" +
      "Conformément à nos conditions de vente, des pénalités de retard et l'indemnité forfaitaire de recouvrement s'appliquent : {penalites} à ce jour.\n\n" +
      "{instructions_paiement}\n\n" +
      "Sans règlement sous 15 jours, nous serons contraints de vous adresser une mise en demeure.\n\n" +
      "{nom_entreprise}",
  },
  {
    days_after_due: 35,
    tone: "mise_en_demeure",
    enabled: true,
    formal_notice: true,
    subject: "Mise en demeure : facture {numero_facture}",
    body:
      "Madame, Monsieur,\n\n" +
      "Malgré nos précédentes relances, la facture {numero_facture} d'un montant de {montant}, échue le {date_echeance}, demeure impayée ({jours_retard} jours de retard).\n\n" +
      "Nous vous mettons en demeure de régler cette somme, majorée des pénalités de retard et de l'indemnité forfaitaire de recouvrement ({penalites}), sous 8 jours à réception de la présente.\n\n" +
      "{instructions_paiement}\n\n" +
      "À défaut, nous nous réservons le droit d'engager toute procédure de recouvrement.\n\n" +
      "Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.\n{nom_entreprise}",
  },
];
