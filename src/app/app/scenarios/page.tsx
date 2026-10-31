import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/company";
import { daysLate, todayParis } from "@/lib/invoices";
import {
  DEFAULT_STEPS,
  MAX_DAYS,
  MAX_PAYMENT_INSTRUCTIONS,
  MIN_DAYS,
  toneLabel,
} from "@/lib/templates";
import StepEditor, { type EditorSample, type EditorStep } from "./step-editor";
import { addStep, saveSettings } from "./actions";

const STEP_COLUMNS = "id, days_after_due, tone, subject, body, enabled, formal_notice";

export default async function ScenariosPage({
  searchParams,
}: {
  searchParams: {
    error?: string;
    step?: string;
    saved?: string;
    deleted?: string;
    settings?: string;
    settings_saved?: string;
  };
}) {
  const company = await getCompany();
  if (!company) redirect("/app");

  const supabase = createClient();

  const { data: cs, error: settingsError } = await supabase
    .from("companies")
    .select("penalty_rate, fixed_fee_cents, payment_instructions, reply_to_email")
    .eq("id", company.id)
    .maybeSingle();

  // Lu à part : si la migration 0005 n'est pas encore passée, la page reste utilisable.
  const { data: dg, error: dgError } = await supabase
    .from("companies")
    .select("digest_enabled")
    .eq("id", company.id)
    .maybeSingle();
  const digestAvailable = !dgError && dg !== null;
  const digestEnabled = digestAvailable ? dg.digest_enabled !== false : true;

  let stepsRes = await supabase
    .from("reminder_steps")
    .select(STEP_COLUMNS)
    .eq("company_id", company.id)
    .order("days_after_due", { ascending: true });

  // Première visite : on crée le scénario par défaut (une seule fois).
  if (!stepsRes.error && !settingsError && (stepsRes.data ?? []).length === 0) {
    await supabase.from("reminder_steps").upsert(
      DEFAULT_STEPS.map((s) => ({ ...s, company_id: company.id })),
      { onConflict: "company_id,days_after_due", ignoreDuplicates: true },
    );
    stepsRes = await supabase
      .from("reminder_steps")
      .select(STEP_COLUMNS)
      .eq("company_id", company.id)
      .order("days_after_due", { ascending: true });
  }

  if (stepsRes.error || settingsError || !cs) {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Scénarios de relance</h1>
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          Impossible de charger les scénarios. Vérifiez que les migrations{" "}
          <b>0003_reminder_steps.sql</b> et <b>0004_reminders.sql</b> ont bien été exécutées dans
          Supabase (voir SETUP.md).
        </p>
      </section>
    );
  }

  const steps = (stepsRes.data ?? []) as EditorStep[];
  const settings = {
    company_name: company.name,
    penalty_rate: Number(cs.penalty_rate),
    fixed_fee_cents: Number(cs.fixed_fee_cents),
    payment_instructions: String(cs.payment_instructions ?? ""),
  };

  // Facture réelle pour l'aperçu : la plus en retard, sinon un exemple fictif.
  const today = todayParis();
  const { data: inv } = await supabase
    .from("invoices")
    .select("client_name, invoice_number, amount_cents, due_date")
    .eq("company_id", company.id)
    .eq("status", "unpaid")
    .order("due_date", { ascending: true })
    .limit(50);
  const real = ((inv ?? []) as {
    client_name: string;
    invoice_number: string;
    amount_cents: number | string;
    due_date: string;
  }[]).find((i) => daysLate(i.due_date, today) > 0);

  const sample: EditorSample = real
    ? {
        client_name: real.client_name,
        invoice_number: real.invoice_number,
        amount_cents: Number(real.amount_cents),
        isExample: false,
      }
    : { client_name: "Exemple SARL", invoice_number: "F-2026-0001", amount_cents: 120000, isExample: true };

  const active = steps.filter((s) => s.enabled);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Scénarios de relance</h1>
        <p className="max-w-2xl text-muted">
          Chaque étape est un e-mail envoyé un certain nombre de jours après l&apos;échéance,
          avec un ton de plus en plus ferme. Modifiez les textes comme vous le souhaitez :
          l&apos;aperçu se met à jour pendant que vous écrivez.
        </p>
      </div>

      <p role="status" className="max-w-2xl rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
        Aucun e-mail n&apos;est envoyé pour l&apos;instant : l&apos;envoi arrive à l&apos;étape suivante, avec une
        validation de votre part avant chaque relance.
      </p>

      {searchParams.deleted && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">
          Étape supprimée.
        </p>
      )}
      {searchParams.error && !searchParams.step && !searchParams.settings && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          {searchParams.error}
        </p>
      )}

      <ol className="flex flex-wrap items-stretch gap-2" aria-label="Aperçu de la séquence">
        {active.length === 0 ? (
          <li className="text-sm text-muted">Aucune étape active.</li>
        ) : (
          active.map((s, n) => (
            <li key={s.id} className="flex items-center gap-2">
              {n > 0 && <span aria-hidden="true" className="text-muted">→</span>}
              <a
                href={`#step-${s.id}`}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm hover:bg-brand-soft"
              >
                <span className="block font-extrabold tabular-nums">
                  {s.days_after_due >= 0 ? `J+${s.days_after_due}` : `J${s.days_after_due}`}
                </span>
                <span className="block text-xs text-muted">{toneLabel(s.tone)}</span>
              </a>
            </li>
          ))
        )}
      </ol>

      <form
        id="reglages"
        action={saveSettings}
        className="flex max-w-3xl scroll-mt-4 flex-col gap-4 rounded-lg border border-line bg-white p-4"
      >
        <div>
          <h2 className="font-extrabold">Réglages utilisés dans vos e-mails</h2>
          <p className="text-sm text-muted">
            Ces valeurs alimentent les variables <span className="font-mono">{"{penalites}"}</span> et{" "}
            <span className="font-mono">{"{instructions_paiement}"}</span>. Reprenez les conditions
            inscrites dans vos conditions générales de vente et sur vos factures : un taux ou une
            indemnité différents de ceux de vos CGV peuvent être contestés.
          </p>
        </div>

        {searchParams.settings && searchParams.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
            {searchParams.error}
          </p>
        )}
        {searchParams.settings_saved && (
          <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">
            Réglages enregistrés.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Taux annuel des pénalités de retard (%)
            <input
              name="penalty_rate"
              inputMode="decimal"
              defaultValue={String(settings.penalty_rate).replace(".", ",")}
              required
              className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Indemnité forfaitaire de recouvrement (€)
            <input
              name="fixed_fee"
              inputMode="decimal"
              defaultValue={String(settings.fixed_fee_cents / 100).replace(".", ",")}
              required
              className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Votre adresse e-mail de réponse
          <input
            name="reply_to_email"
            type="email"
            defaultValue={String(cs.reply_to_email ?? "")}
            autoComplete="email"
            placeholder="comptabilite@votre-entreprise.fr"
            className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
          />
          <span className="text-xs font-normal text-muted">
            Quand un client répond à une relance, sa réponse arrive ici. Obligatoire pour envoyer.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Instructions de paiement
          <textarea
            name="payment_instructions"
            defaultValue={settings.payment_instructions}
            maxLength={MAX_PAYMENT_INSTRUCTIONS}
            rows={3}
            placeholder="Règlement par virement : IBAN FR76 … (BIC …), en indiquant le numéro de facture."
            className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
          />
          <span className="text-xs font-normal text-muted">
            Insérées à la place de {"{instructions_paiement}"}. {MAX_PAYMENT_INSTRUCTIONS} caractères maximum.
          </span>
        </label>
        {digestAvailable && (
          <label className="flex items-start gap-3 rounded-lg bg-canvas px-3 py-3 text-sm">
            <input type="hidden" name="digest_field" value="1" />
            <input
              type="checkbox"
              name="digest_enabled"
              defaultChecked={digestEnabled}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
            />
            <span>
              <span className="font-semibold">Récapitulatif quotidien par e-mail</span>
              <span className="block text-muted">
                Chaque matin en semaine, vous recevez un e-mail si des relances sont à valider.
                Rien n&apos;est envoyé à vos clients sans votre accord.
              </span>
            </span>
          </label>
        )}
        <div>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            Enregistrer les réglages
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-5">
        {steps.map((s, n) => (
          <StepEditor
            key={s.id}
            step={s}
            index={n}
            sample={sample}
            settings={settings}
            today={today}
            saved={searchParams.saved === s.id}
            error={searchParams.step === s.id ? searchParams.error ?? null : null}
          />
        ))}
      </div>

      <form
        action={addStep}
        className="flex max-w-3xl flex-wrap items-end gap-3 rounded-lg border border-dashed border-line bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Ajouter une étape à J+
          <input
            name="days_after_due"
            type="number"
            inputMode="numeric"
            min={MIN_DAYS}
            max={MAX_DAYS}
            step={1}
            required
            placeholder="15"
            className="w-32 rounded-lg border border-line bg-white px-3 py-2 font-normal"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-line bg-white px-4 py-2.5 font-semibold hover:bg-brand-soft"
        >
          Ajouter
        </button>
        <p className="basis-full text-xs text-muted">
          La nouvelle étape reprend le modèle « formel » : vous pouvez ensuite la modifier.
        </p>
      </form>

      <p className="max-w-3xl text-xs text-muted">
        Les modèles proposés sont indicatifs. Faites-les relire par votre conseil ou votre
        expert-comptable avant d&apos;envoyer des relances à de vrais clients, en particulier la mise
        en demeure.
      </p>
    </section>
  );
}
