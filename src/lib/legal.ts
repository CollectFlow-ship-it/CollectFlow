// Informations légales de l'éditeur. C'est le SEUL fichier à compléter :
// les pages « Mentions légales », « Conditions d'utilisation » et « Confidentialité »
// s'en servent. Une valeur vide s'affiche « [à compléter] » sur le site.
export const LEGAL = {
  // Nom et prénom de la personne qui édite le site (ou raison sociale d'une société).
  editorName: "Roman Ndjambou",
  // Ex. : « Entrepreneur individuel (micro-entreprise) », « SASU au capital de … € ».
  legalForm: "",
  // Adresse postale professionnelle (peut être une adresse de domiciliation).
  address: "31 rue de la Picotière, 49000 Angers",
  // Numéro SIRET (14 chiffres) : indispensable avant de facturer un client.
  siret: "",
  // Numéro de TVA intracommunautaire, ou laisser vide si non assujetti.
  vatNumber: "",
  // Adresse e-mail de contact publique.
  contactEmail: "contact@collectflow.fr",
  // Région où se trouve la base de données Supabase (ex. « Union européenne, Paris »).
  dataRegion: "",
  // Date de dernière mise à jour des textes (jj/mm/aaaa).
  updatedOn: "01/11/2026",
};

export const TODO = "[à compléter]";
export function val(v: string): string {
  return v.trim() ? v.trim() : TODO;
}
export function missingFields(): string[] {
  const required: (keyof typeof LEGAL)[] = [
    "editorName",
    "legalForm",
    "address",
    "siret",
    "contactEmail",
    "dataRegion",
  ];
  return required.filter((k) => !LEGAL[k].trim());
}
