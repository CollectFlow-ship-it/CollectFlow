"use client";

import { useRef, useState } from "react";
import { addDays } from "@/lib/invoices";
import {
  buildVars,
  fillTemplate,
  MAX_BODY,
  MAX_DAYS,
  MAX_SUBJECT,
  MIN_DAYS,
  TONES,
  unknownVariables,
  VARIABLES,
} from "@/lib/templates";
import { deleteStep, saveStep } from "./actions";

export type EditorStep = {
  id: string;
  days_after_due: number;
  tone: string;
  subject: string;
  body: string;
  enabled: boolean;
  formal_notice: boolean;
};

export type EditorSample = {
  client_name: string;
  invoice_number: string;
  amount_cents: number;
  isExample: boolean;
};

export type EditorSettings = {
  company_name: string;
  penalty_rate: number;
  fixed_fee_cents: number;
  payment_instructions: string;
};

export default function StepEditor({
  step,
  index,
  sample,
  settings,
  today,
  saved,
  error,
}: {
  step: EditorStep;
  index: number;
  sample: EditorSample;
  settings: EditorSettings;
  today: string;
  saved: boolean;
  error: string | null;
}) {
  const [days, setDays] = useState(String(step.days_after_due));
  const [tone, setTone] = useState(step.tone);
  const [subject, setSubject] = useState(step.subject);
  const [body, setBody] = useState(step.body);
  const [enabled, setEnabled] = useState(step.enabled);
  const [formal, setFormal] = useState(step.formal_notice);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const dayNum = Number(days);
  const dayOk = days.trim() !== "" && Number.isInteger(dayNum) && dayNum >= MIN_DAYS && dayNum <= MAX_DAYS;
  const effectiveDays = dayOk ? dayNum : step.days_after_due;

  const vars = buildVars({
    client_name: sample.client_name,
    invoice_number: sample.invoice_number,
    amount_cents: sample.amount_cents,
    due_date: addDays(today, -effectiveDays),
    late_days: effectiveDays,
    company_name: settings.company_name,
    penalty_rate: settings.penalty_rate,
    fixed_fee_cents: settings.fixed_fee_cents,
    payment_instructions: settings.payment_instructions,
  });
  const unknown = unknownVariables(subject + "\n" + body);
  const previewSubject = fillTemplate(subject, vars);
  const previewBody = fillTemplate(body, vars);

  function insertVariable(key: string) {
    const token = `{${key}}`;
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const label = effectiveDays >= 0 ? `J+${effectiveDays}` : `J${effectiveDays}`;

  return (
    <article
      id={`step-${step.id}`}
      className={
        "scroll-mt-4 rounded-lg border bg-white " + (enabled ? "border-line" : "border-line opacity-80")
      }
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {index + 1}
          </span>
          <div>
            <p className="font-extrabold tabular-nums">{label}</p>
            <p className="text-xs text-muted">
              {TONES.find((t) => t.key === tone)?.label ?? tone}
              {formal ? " · courrier recommandé, pas d'e-mail" : ""}
              {enabled ? "" : " · désactivée"}
            </p>
          </div>
        </div>
        {saved && (
          <span role="status" className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-good">
            Étape enregistrée
          </span>
        )}
      </header>

      <div className="grid gap-5 p-4 lg:grid-cols-2">
        <form action={saveStep} className="flex min-w-0 flex-col gap-4">
          <input type="hidden" name="id" value={step.id} />

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Délai (jours)
              <input
                name="days_after_due"
                type="number"
                inputMode="numeric"
                min={MIN_DAYS}
                max={MAX_DAYS}
                step={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                required
                className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
              />
              <span className="text-xs font-normal text-muted">
                Après l&apos;échéance (négatif = avant)
              </span>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Ton
              <select
                name="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
              >
                {TONES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Objet
            <input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={MAX_SUBJECT}
              required
              className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Message
            <textarea
              ref={bodyRef}
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={MAX_BODY}
              rows={12}
              required
              className="rounded-lg border border-line bg-white px-3 py-2 font-normal leading-relaxed"
            />
          </label>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted">Cliquez pour insérer une variable à l&apos;endroit du curseur :</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  title={v.label}
                  onClick={() => insertVariable(v.key)}
                  className="rounded-md border border-line bg-brand-soft px-2 py-1 font-mono text-xs text-brand hover:border-brand"
                >
                  {`{${v.key}}`}
                </button>
              ))}
            </div>
            {unknown.length > 0 && (
              <p role="alert" className="text-sm text-bad">
                Variable inconnue : {unknown.map((u) => `{${u}}`).join(", ")}. Corrigez-la avant d&apos;enregistrer.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Étape active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="formal_notice"
                checked={formal}
                onChange={(e) => setFormal(e.target.checked)}
              />
              Mise en demeure : étape à envoyer par courrier recommandé (aucun e-mail ne part). Laissez décoché pour une relance par e-mail.
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={!dayOk || unknown.length > 0}
              className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              Enregistrer l&apos;étape
            </button>
          </div>
        </form>

        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-sm font-semibold">Aperçu</p>
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="flex flex-col gap-1 border-b border-line bg-canvas px-3 py-2.5 text-xs">
              <p>
                <span className="inline-block w-10 text-muted">De</span>
                {settings.company_name}
              </p>
              <p>
                <span className="inline-block w-10 text-muted">À</span>
                {sample.client_name}
              </p>
              <p className="mt-1 text-sm font-bold">{previewSubject || "(objet vide)"}</p>
            </div>
            <div className="whitespace-pre-wrap break-words px-3 py-3 text-sm leading-relaxed">
              {previewBody}
            </div>
            {formal && (
              <p className="border-t border-line bg-canvas px-3 py-2 text-xs text-muted">
                Cette étape n&apos;est pas envoyée par e-mail : vous postez la lettre en recommandé.
              </p>
            )}
          </div>
          <p className="text-xs text-muted">
            {sample.isExample
              ? "Exemple fictif : facture de 1 200,00 € chez « Exemple SARL »."
              : `Calculé avec la facture ${sample.invoice_number} de ${sample.client_name}.`}{" "}
            Les jours de retard et les pénalités correspondent au jour où l&apos;e-mail partira ({label}).
          </p>
        </div>
      </div>

      <footer className="flex justify-end border-t border-line px-4 py-2">
        <details>
          <summary className="cursor-pointer list-none rounded-lg px-2 py-1.5 text-xs font-semibold text-muted hover:bg-canvas">
            Supprimer cette étape
          </summary>
          <form action={deleteStep} className="mt-1 flex w-60 flex-col gap-2 rounded-lg border border-line bg-white p-3">
            <input type="hidden" name="id" value={step.id} />
            <p className="text-xs text-muted">Supprimer définitivement l&apos;étape {label} ?</p>
            <button type="submit" className="rounded-lg bg-bad px-2.5 py-1.5 text-xs font-semibold text-white">
              Oui, supprimer
            </button>
          </form>
        </details>
      </footer>
    </article>
  );
}
