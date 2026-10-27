// Lettre de mise en demeure en PDF (jointe à l'e-mail de l'étape concernée).
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type NoticeInput = {
  company_name: string;
  client_name: string;
  invoice_number: string;
  subject: string;
  body: string;
  dateLabel: string; // jj/mm/aaaa
};

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 62;
const BODY_SIZE = 11;
const LEADING = 16;

// Les polices PDF standard ne couvrent que le jeu de caractères Windows-1252 :
// on remplace les espaces spéciaux et tout caractère non supporté.
function safe(font: PDFFont, text: string): string {
  const base = text.replace(/[    ]/g, " ").replace(/[‘’]/g, "'");
  let out = "";
  for (const ch of base) {
    if (ch === "\n") {
      out += ch; // les sauts de ligne sont gérés par le découpage en paragraphes
      continue;
    }
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      out += "?";
    }
  }
  return out;
}

function wrap(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function buildFormalNoticePdf(i: NoticeInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.06, 0.1, 0.18);
  const muted = rgb(0.34, 0.39, 0.49);
  const width = PAGE_W - 2 * MARGIN;

  doc.setTitle(`Mise en demeure ${i.invoice_number}`);
  doc.setAuthor(safe(regular, i.company_name));
  doc.setCreator("CollectFlow");

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const draw = (text: string, font: PDFFont, size: number, color = ink, x = MARGIN) => {
    if (y < MARGIN + size) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    page.drawText(text, { x, y, size, font, color });
  };

  // En-tête : expéditeur à gauche, date à droite
  draw(safe(bold, i.company_name), bold, 14);
  const dateText = safe(regular, `Le ${i.dateLabel}`);
  page.drawText(dateText, {
    x: PAGE_W - MARGIN - regular.widthOfTextAtSize(dateText, BODY_SIZE),
    y,
    size: BODY_SIZE,
    font: regular,
    color: muted,
  });
  y -= 36;

  // Destinataire
  draw("Destinataire", regular, 9, muted);
  y -= 15;
  for (const l of wrap(bold, 12, safe(bold, i.client_name), width)) {
    draw(l, bold, 12);
    y -= LEADING;
  }
  y -= 12;

  // Objet
  for (const l of wrap(bold, BODY_SIZE, safe(bold, `Objet : ${i.subject}`), width)) {
    draw(l, bold, BODY_SIZE);
    y -= LEADING;
  }
  y -= 10;

  // Corps de la lettre
  for (const l of wrap(regular, BODY_SIZE, safe(regular, i.body), width)) {
    if (l !== "") draw(l, regular, BODY_SIZE);
    y -= LEADING;
  }

  return doc.save();
}
