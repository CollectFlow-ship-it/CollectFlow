// Lecture des fichiers CSV de factures (exports Excel, Pennylane, etc.).
// Fichier sans dépendance : il sert dans le navigateur (aperçu) et sur le
// serveur (revalidation avant enregistrement).

export type ImportRow = {
  client_name: string;
  client_email: string;
  invoice_number: string;
  amount_cents: number;
  due_date: string; // aaaa-mm-jj
};

export type RowError = { line: number; message: string };

export type ParseResult = {
  rows: ImportRow[];
  errors: RowError[];
  total: number; // nombre de lignes de données lues
  fatal?: string; // problème qui empêche toute lecture
};

export const MAX_ROWS = 1000;
export const MAX_FILE_BYTES = 1_000_000;
const MAX_CENTS = 99_999_999_999;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normHeader(h: string): string {
  return stripAccents(h).toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Noms de colonnes acceptés (comparés sans accents, majuscules ni ponctuation).
const ALIASES = {
  client_name: [
    "client", "nomclient", "nom", "clientname", "customer", "customername",
    "societe", "raisonsociale", "tiers", "destinataire",
  ],
  client_email: [
    "email", "mail", "courriel", "emailclient", "adresseemail", "emailcontact",
    "clientemail", "customeremail",
  ],
  invoice_number: [
    "numero", "numerofacture", "numerodefacture", "numerodelafacture",
    "nfacture", "nodefacture", "ndefacture", "numfacture", "facture",
    "invoice", "invoicenumber", "invoiceno", "ref", "reference",
    "referencefacture", "piece", "numpiece", "numerodepiece",
  ],
  amount: [
    "montant", "montantttc", "ttc", "total", "totalttc", "amount", "soldedu",
    "reste", "restedu", "montantdu",
  ],
  due_date: [
    "echeance", "dateecheance", "datedecheance", "dateecheancefacture", "due",
    "duedate", "datelimite",
  ],
} as const;

const LABELS: Record<keyof typeof ALIASES, string> = {
  client_name: "client",
  client_email: "e-mail",
  invoice_number: "numéro de facture",
  amount: "montant",
  due_date: "échéance",
};

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n").find((l) => l.trim() !== "") ?? "";
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  let inQuotes = false;
  for (const c of firstLine) {
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes && c in counts) counts[c]++;
  }
  let best = ",";
  let max = 0;
  for (const d of [";", ",", "\t"]) {
    if (counts[d] > max) {
      max = counts[d];
      best = d;
    }
  }
  return best;
}

function splitRecords(text: string, delim: string) {
  const records: string[][] = [];
  const lines: number[] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let line = 1;
  let startLine = 1;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.length > 1 || row[0].trim() !== "") {
      records.push(row);
      lines.push(startLine);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (c === "\n") line++;
        field += c;
      }
    } else if (c === '"' && field === "") {
      inQuotes = true;
    } else if (c === delim) {
      pushField();
    } else if (c === "\r") {
      // ignoré : les fins de ligne Windows sont gérées par \n
    } else if (c === "\n") {
      pushRow();
      line++;
      startLine = line;
    } else {
      field += c;
    }
  }
  pushRow();
  return { records, lines };
}

// "1 240,50 €", "1240.50", "1.240,50", "1,240.50" -> centimes. null si illisible.
export function parseAmountToCents(raw: string): number | null {
  const s = raw.replace(/eur|€/gi, "").replace(/[\s  ']/g, "");
  if (s === "" || !/^[\d.,]+$/.test(s)) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  const sep = Math.max(lastComma, lastDot);

  let intPart: string;
  let decPart = "";

  if (sep === -1) {
    intPart = s;
  } else {
    const sepChar = s[sep];
    const otherChar = sepChar === "," ? "." : ",";
    const count = s.split(sepChar).length - 1;
    const hasOther = s.includes(otherChar);
    const after = s.slice(sep + 1);

    if (hasOther) {
      // Les deux symboles sont présents : le dernier est la virgule décimale.
      intPart = s.slice(0, sep).replace(/[.,]/g, "");
      decPart = after;
    } else if (count > 1) {
      // Un seul symbole répété : séparateur de milliers (1.234.567).
      intPart = s.replace(/[.,]/g, "");
    } else if (after.length === 3 && sep > 0) {
      // 1.240 ou 1,240 : traité comme des milliers.
      intPart = s.replace(/[.,]/g, "");
    } else if (after.length >= 1 && after.length <= 2) {
      intPart = s.slice(0, sep);
      decPart = after;
    } else {
      return null;
    }
  }

  if (!/^\d+$/.test(intPart) || (decPart !== "" && !/^\d{1,2}$/.test(decPart))) {
    return null;
  }
  const cents = parseInt(intPart, 10) * 100 + parseInt((decPart + "00").slice(0, 2), 10);
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_CENTS) return null;
  return cents;
}

function toIsoDate(y: number, m: number, d: number): string | null {
  if (y < 2000 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// jj/mm/aaaa, jj-mm-aaaa, jj.mm.aaaa, jj/mm/aa, aaaa-mm-jj -> aaaa-mm-jj.
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s);
  if (m) return toIsoDate(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:\s.*)?$/.exec(s);
  if (m) return toIsoDate(+m[3], +m[2], +m[1]);
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2})(?:\s.*)?$/.exec(s);
  if (m) return toIsoDate(2000 + +m[3], +m[2], +m[1]);
  return null;
}

// Règles communes (navigateur et serveur). Renvoie un message ou null si valide.
export function checkRow(r: ImportRow): string | null {
  if (r.client_name.length < 1 || r.client_name.length > 200) {
    return "Nom du client manquant ou trop long.";
  }
  if (r.client_email.length > 254 || !EMAIL_RE.test(r.client_email)) {
    return `Adresse e-mail invalide : « ${r.client_email.slice(0, 60)} ».`;
  }
  if (r.invoice_number.length < 1 || r.invoice_number.length > 80) {
    return "Numéro de facture manquant ou trop long.";
  }
  if (
    !Number.isSafeInteger(r.amount_cents) ||
    r.amount_cents <= 0 ||
    r.amount_cents > MAX_CENTS
  ) {
    return "Montant invalide.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.due_date) || parseDate(r.due_date) !== r.due_date) {
    return "Date d'échéance invalide.";
  }
  return null;
}

// Revalidation côté serveur : on ne fait jamais confiance à ce qui vient du navigateur.
export function validateImportRows(
  input: unknown,
): { ok: true; rows: ImportRow[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "Données invalides." };
  if (input.length === 0) return { ok: false, error: "Aucune facture à importer." };
  if (input.length > MAX_ROWS) {
    return { ok: false, error: `Maximum ${MAX_ROWS} factures par import.` };
  }

  const rows: ImportRow[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < input.length; i++) {
    const r = input[i] as Record<string, unknown> | null;
    if (
      !r ||
      typeof r.client_name !== "string" ||
      typeof r.client_email !== "string" ||
      typeof r.invoice_number !== "string" ||
      typeof r.amount_cents !== "number" ||
      typeof r.due_date !== "string"
    ) {
      return { ok: false, error: `Ligne ${i + 1} : format invalide.` };
    }
    const row: ImportRow = {
      client_name: r.client_name.trim(),
      client_email: r.client_email.trim().toLowerCase(),
      invoice_number: r.invoice_number.trim(),
      amount_cents: r.amount_cents,
      due_date: r.due_date,
    };
    const problem = checkRow(row);
    if (problem) return { ok: false, error: `Ligne ${i + 1} : ${problem}` };
    if (seen.has(row.invoice_number)) {
      return { ok: false, error: `Le numéro ${row.invoice_number} apparaît deux fois.` };
    }
    seen.add(row.invoice_number);
    rows.push(row);
  }
  return { ok: true, rows };
}

export function buildRows(rawText: string): ParseResult {
  const text = rawText.replace(/^﻿/, "");
  const empty = (fatal: string): ParseResult => ({ rows: [], errors: [], total: 0, fatal });

  if (text.trim() === "") return empty("Le fichier est vide.");

  const delim = detectDelimiter(text);
  const { records, lines } = splitRecords(text, delim);
  if (records.length < 2) {
    return empty("Le fichier doit contenir une ligne d'en-têtes puis au moins une facture.");
  }

  const headers = records[0].map(normHeader);
  const idx = {} as Record<keyof typeof ALIASES, number>;
  const keys = Object.keys(ALIASES) as (keyof typeof ALIASES)[];
  const used = new Set<number>();

  // Passe 1 : nom de colonne exact (aux accents et à la ponctuation près).
  keys.forEach((key) => {
    const aliases: readonly string[] = ALIASES[key];
    const i = headers.findIndex((h) => aliases.includes(h));
    idx[key] = i;
    if (i !== -1) used.add(i);
  });

  // Passe 2 : pour les colonnes encore introuvables, on accepte un en-tête
  // qui contient un mot-clé (« Montant TTC restant dû », « Date d'échéance »…).
  // L'aperçu montre ensuite ce qui a été lu, donc une erreur se voit.
  const FUZZY: Record<keyof typeof ALIASES, { has: string[]; not: string[] }> = {
    client_email: { has: ["email", "mail", "courriel"], not: [] },
    invoice_number: {
      has: ["numero", "numfacture", "facture", "invoice", "reference", "piece"],
      not: ["client", "date", "montant", "total", "solde", "echeance", "email", "mail"],
    },
    amount: { has: ["montant", "amount", "total", "solde"], not: ["date", "numero"] },
    due_date: { has: ["echeance", "duedate"], not: [] },
    client_name: { has: ["client", "nom", "societe", "customer"], not: ["email", "mail", "numero", "date", "montant"] },
  };
  (["client_email", "invoice_number", "amount", "due_date", "client_name"] as const).forEach(
    (key) => {
      if (idx[key] !== -1) return;
      const { has, not } = FUZZY[key];
      const i = headers.findIndex(
        (h, n) =>
          !used.has(n) &&
          has.some((w) => h.includes(w)) &&
          !not.some((w) => h.includes(w)),
      );
      idx[key] = i;
      if (i !== -1) used.add(i);
    },
  );

  const missing = keys.filter((k) => idx[k] === -1).map((k) => LABELS[k]);

  if (missing.length > 0) {
    const found = records[0].map((h) => h.trim()).filter(Boolean).join(", ");
    return empty(
      `Colonnes introuvables : ${missing.join(", ")}. Colonnes lues dans votre fichier : ${found || "aucune"}. Utilisez le modèle fourni.`,
    );
  }

  const dataCount = records.length - 1;
  if (dataCount > MAX_ROWS) {
    return empty(`Le fichier contient ${dataCount} lignes. Le maximum est ${MAX_ROWS} par import : découpez-le en plusieurs fichiers.`);
  }

  const rows: ImportRow[] = [];
  const errors: RowError[] = [];
  const firstLineOf = new Map<string, number>();

  for (let r = 1; r < records.length; r++) {
    const rec = records[r];
    const line = lines[r];
    const get = (i: number) => (rec[i] ?? "").trim();

    const amount = parseAmountToCents(get(idx.amount));
    if (amount === null) {
      errors.push({ line, message: `Montant illisible : « ${get(idx.amount).slice(0, 40)} ».` });
      continue;
    }
    const due = parseDate(get(idx.due_date));
    if (due === null) {
      errors.push({
        line,
        message: `Date d'échéance illisible : « ${get(idx.due_date).slice(0, 40)} » (format attendu : jj/mm/aaaa).`,
      });
      continue;
    }

    const row: ImportRow = {
      client_name: get(idx.client_name),
      client_email: get(idx.client_email).toLowerCase(),
      invoice_number: get(idx.invoice_number),
      amount_cents: amount,
      due_date: due,
    };

    const problem = checkRow(row);
    if (problem) {
      errors.push({ line, message: problem });
      continue;
    }

    const earlier = firstLineOf.get(row.invoice_number);
    if (earlier !== undefined) {
      errors.push({
        line,
        message: `Le numéro ${row.invoice_number} est déjà présent ligne ${earlier} du fichier.`,
      });
      continue;
    }
    firstLineOf.set(row.invoice_number, line);
    rows.push(row);
  }

  return { rows, errors, total: dataCount };
}
