"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildRows, MAX_FILE_BYTES, type ParseResult } from "@/lib/csv";
import { formatDate, formatEur } from "@/lib/invoices";
import { importInvoices } from "../actions";

export default function ImportForm() {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setServerError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setParsed(null);
      setFileName("");
      return;
    }
    setFileName(file.name);

    if (file.size > MAX_FILE_BYTES) {
      setParsed({
        rows: [],
        errors: [],
        total: 0,
        fatal: "Le fichier est trop volumineux (1 Mo maximum).",
      });
      return;
    }

    const buffer = await file.arrayBuffer();
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      // Exports Excel français anciens : encodage Windows-1252.
      text = new TextDecoder("windows-1252").decode(buffer);
    }
    setParsed(buildRows(text));
  }

  async function onImport() {
    if (!parsed || parsed.rows.length === 0 || pending) return;
    setServerError(null);
    setPending(true);
    try {
      const res = await importInvoices(parsed.rows);
      if (!res.ok) {
        setServerError(res.error);
        setPending(false);
        return;
      }
      router.push(`/app/invoices?imported=${res.inserted}&skipped=${res.skipped}`);
    } catch {
      setServerError("L'import a échoué. Vérifiez votre connexion et réessayez.");
      setPending(false);
    }
  }

  const validCount = parsed?.rows.length ?? 0;
  const errorCount = parsed?.errors.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Fichier CSV
        <input
          id="csv-file"
          type="file"
          accept=".csv,.txt,text/csv"
          onChange={onFile}
          className="rounded-lg border border-line bg-white px-3 py-2 font-normal file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand"
        />
      </label>

      {parsed?.fatal && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          {parsed.fatal}
        </p>
      )}

      {parsed && !parsed.fatal && (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            <b>{fileName}</b> : {parsed.total} ligne{parsed.total > 1 ? "s" : ""} lue
            {parsed.total > 1 ? "s" : ""},{" "}
            <span className="font-semibold text-good">{validCount} valide{validCount > 1 ? "s" : ""}</span>
            {errorCount > 0 && (
              <>
                ,{" "}
                <span className="font-semibold text-bad">
                  {errorCount} en erreur
                </span>
              </>
            )}
            .
          </p>

          {errorCount > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <p className="mb-2 font-semibold text-bad">
                Ces lignes ne seront pas importées :
              </p>
              <ul className="flex flex-col gap-1 text-ink">
                {parsed.errors.slice(0, 15).map((er) => (
                  <li key={er.line + er.message}>
                    <span className="font-semibold">Ligne {er.line}</span> : {er.message}
                  </li>
                ))}
                {errorCount > 15 && (
                  <li className="text-muted">… et {errorCount - 15} autres.</li>
                )}
              </ul>
            </div>
          )}

          {validCount > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">E-mail</th>
                    <th className="px-3 py-2">N° facture</th>
                    <th className="px-3 py-2 text-right">Montant</th>
                    <th className="px-3 py-2">Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 8).map((r) => (
                    <tr key={r.invoice_number} className="border-t border-line">
                      <td className="px-3 py-2">{r.client_name}</td>
                      <td className="px-3 py-2">{r.client_email}</td>
                      <td className="px-3 py-2">{r.invoice_number}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatEur(r.amount_cents)}</td>
                      <td className="px-3 py-2">{formatDate(r.due_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validCount > 8 && (
                <p className="border-t border-line px-3 py-2 text-xs text-muted">
                  Aperçu des 8 premières lignes sur {validCount}.
                </p>
              )}
            </div>
          )}

          {serverError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
              {serverError}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={onImport}
              disabled={pending || validCount === 0}
              className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {pending
                ? "Import en cours…"
                : `Importer ${validCount} facture${validCount > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
