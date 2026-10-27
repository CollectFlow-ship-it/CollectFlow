import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/company";
import { formatDate, formatEur, todayParis } from "@/lib/invoices";
import { emailConfigured } from "@/lib/email";
import { toneLabel } from "@/lib/templates";
import {
  computeDue,
  renderReminder,
  type InvoiceRow,
  type RecordRow,
  type StepRow,
} from "@/lib/reminders";
import {
  markLetterSent,
  sendAll,
  sendReminder,
  sendTest,
  skipReminder,
} from "./actions";

// Un envoi groupé de 10 e-mails prend une dizaine de secondes.
export const maxDuration = 60;

const MAX_BATCH = 10;

const STATUS: Record<string, { label: string; className: string }> = {
  sent: { label: "Envoyée", className: "bg-green-100 text-good" },
  failed: { label: "Échec", className: "bg-red-100 text-bad" },
  skipped: { label: "Ignorée", className: "bg-slate-200 text-slate-700" },
  manual: { label: "Courrier", className: "bg-brand-soft text-brand" },
  sending: { label: "En cours", className: "bg-amber-100 text-amber-800" },
};

function stepLabel(days: number): string {
  return days >= 0 ? `J+${days}` : `J${days}`;
}

type JournalRow = {
  id: string;
  step_days: number;
  tone: string;
  to_email: string;
  subject: string;
  status: string;
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: {
    error?: string;
    sent?: string;
    failed?: string;
    skipped?: string;
    manual?: string;
    test?: string;
  };
}) {
  const company = await getCompany();
  if (!company) redirect("/app");

  const supabase = createClient();

  const [cs, stepsRes, invRes, recRes, journalRes] = await Promise.all([
    supabase
      .from("companies")
      .select("penalty_rate, fixed_fee_cents, payment_instructions, reply_to_email")
      .eq("id", company.id)
      .maybeSingle(),
    supabase
      .from("reminder_steps")
      .select("id, days_after_due, tone, subject, body, enabled, formal_notice")
      .eq("company_id", company.id),
    supabase
      .from("invoices")
      .select("id, client_name, client_email, invoice_number, amount_cents, due_date, status, paused")
      .eq("company_id", company.id)
      .eq("status", "unpaid")
      .limit(1000),
    supabase
      .from("reminders")
      .select("invoice_id, step_id, status")
      .eq("company_id", company.id)
      .limit(5000),
    supabase
      .from("reminders")
      .select("id, step_days, tone, to_email, subject, status, error, created_at, sent_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (cs.error || !cs.data || stepsRes.error || invRes.error || recRes.error || journalRes.error) {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Relances</h1>
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          Impossible de charger les relances. Vérifiez que les migrations{" "}
          <b>0003_reminder_steps.sql</b> et <b>0004_reminders.sql</b> ont bien été exécutées dans
          Supabase (voir SETUP.md).
        </p>
      </section>
    );
  }

  const settings = {
    company_name: company.name,
    penalty_rate: Number(cs.data.penalty_rate),
    fixed_fee_cents: Number(cs.data.fixed_fee_cents),
    payment_instructions: String(cs.data.payment_instructions ?? ""),
  };
  const replyTo = (cs.data.reply_to_email as string | null) ?? null;
  const configured = emailConfigured();
  const ready = configured && Boolean(replyTo);

  const invoices = ((invRes.data ?? []) as InvoiceRow[]).map((i) => ({
    ...i,
    amount_cents: Number(i.amount_cents),
  }));
  const due = computeDue(
    invoices,
    (stepsRes.data ?? []) as StepRow[],
    (recRes.data ?? []) as RecordRow[],
    todayParis(),
  );
  const emailDue = due.filter((d) => !d.step.formal_notice);
  const journal = (journalRes.data ?? []) as JournalRow[];

  const sentN = Number(searchParams.sent);
  const failedN = Number(searchParams.failed);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Relances</h1>
        <p className="max-w-2xl text-muted">
          Voici les relances qui arrivent à échéance d&apos;après votre scénario. Rien ne part
          sans votre accord : vous lisez le message, puis vous cliquez sur Envoyer.
        </p>
      </div>

      {!configured && (
        <p role="status" className="max-w-2xl rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <b>L&apos;envoi n&apos;est pas encore activé.</b> Vous pouvez tout lire et préparer, mais
          les boutons d&apos;envoi restent bloqués tant que la clé Resend n&apos;est pas ajoutée dans
          Vercel (voir SETUP.md, étape 4).
        </p>
      )}
      {configured && !replyTo && (
        <p role="status" className="max-w-2xl rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <b>Adresse de réponse manquante.</b> Vos clients doivent pouvoir vous répondre :{" "}
          <Link href="/app/scenarios#reglages" className="font-semibold underline">
            renseignez-la dans les réglages
          </Link>
          .
        </p>
      )}

      {Number.isFinite(sentN) && searchParams.sent !== undefined && sentN > 0 && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">
          {sentN} relance{sentN > 1 ? "s" : ""} envoyée{sentN > 1 ? "s" : ""}.
          {Number.isFinite(failedN) && failedN > 0 ? ` ${failedN} en échec (voir le journal).` : ""}
        </p>
      )}
      {searchParams.skipped && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">
          Relance ignorée : elle ne sera pas proposée à nouveau.
        </p>
      )}
      {searchParams.manual && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">
          Courrier noté comme envoyé.
        </p>
      )}
      {searchParams.test && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">
          E-mail de test envoyé à {searchParams.test}. Vérifiez aussi vos courriers indésirables.
        </p>
      )}
      {searchParams.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          {searchParams.error}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-3">
        <form action={sendTest}>
          <button
            type="submit"
            disabled={!ready}
            className="rounded-lg border border-line bg-white px-4 py-2.5 font-semibold hover:bg-brand-soft disabled:opacity-50"
          >
            M&apos;envoyer un e-mail de test
          </button>
        </form>

        {emailDue.length > 0 && (
          <details className="rounded-lg border border-line bg-white">
            <summary
              className={
                "list-none rounded-lg px-4 py-2.5 font-semibold " +
                (ready ? "cursor-pointer hover:bg-brand-soft" : "pointer-events-none opacity-50")
              }
            >
              Envoyer les {Math.min(emailDue.length, MAX_BATCH)} premières relances
            </summary>
            <form action={sendAll} className="flex max-w-xs flex-col gap-2 border-t border-line p-3">
              <p className="text-sm text-muted">
                {Math.min(emailDue.length, MAX_BATCH)} e-mail
                {Math.min(emailDue.length, MAX_BATCH) > 1 ? "s" : ""} vont partir chez de vrais
                clients. Avez-vous lu les messages ci-dessous ?
              </p>
              <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                Oui, envoyer
              </button>
            </form>
          </details>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold">
          À valider <span className="tabular-nums text-muted">({due.length})</span>
        </h2>

        {due.length === 0 ? (
          <div className="rounded-lg border border-line bg-white px-5 py-10 text-center text-muted">
            Aucune relance à envoyer pour le moment.{" "}
            {invoices.length === 0 ? (
              <Link href="/app/invoices/import" className="font-semibold text-brand underline">
                Importez vos factures impayées.
              </Link>
            ) : (
              "Les prochaines apparaîtront ici dès qu'une échéance de votre scénario sera atteinte."
            )}
          </div>
        ) : (
          due.map((d) => {
            const msg = renderReminder(d.invoice, d.step, d.late, settings);
            const formal = d.step.formal_notice;
            return (
              <article key={d.invoice.id + d.step.id} className="rounded-lg border border-line bg-white">
                <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-extrabold">{d.invoice.client_name}</p>
                    <p className="text-sm text-muted">
                      {d.invoice.invoice_number} · {formatEur(d.invoice.amount_cents)} · échue le{" "}
                      {formatDate(d.invoice.due_date)}
                      {d.late > 0 ? ` · ${d.late} j de retard` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-brand">
                      {stepLabel(d.step.days_after_due)} · {toneLabel(d.step.tone)}
                    </span>
                    {d.retry && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-bad">
                        Envoi précédent en échec
                      </span>
                    )}
                  </div>
                </header>

                {formal && (
                  <p className="mx-4 mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <b>Mise en demeure : à envoyer par courrier recommandé avec accusé de réception.</b>{" "}
                    CollectFlow n&apos;envoie pas cette étape par e-mail. Copiez la lettre ci-dessous,
                    adressez-la à votre client, puis cliquez sur « J&apos;ai envoyé le courrier ».
                  </p>
                )}

                <details className="border-t border-line">
                  <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-brand">
                    Lire le message
                  </summary>
                  <div className="flex flex-col gap-2 px-4 pb-4 text-sm">
                    <p className="text-muted">
                      À : <span className="text-ink">{msg.to}</span>
                    </p>
                    <p className="font-bold">{msg.subject}</p>
                    <div className="whitespace-pre-wrap break-words rounded-lg bg-canvas px-3 py-3 leading-relaxed">
                      {msg.body}
                    </div>
                  </div>
                </details>

                <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3">
                  <form action={skipReminder}>
                    <input type="hidden" name="invoice_id" value={d.invoice.id} />
                    <input type="hidden" name="step_id" value={d.step.id} />
                    <button type="submit" className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-canvas">
                      Ignorer
                    </button>
                  </form>
                  {formal ? (
                    <form action={markLetterSent}>
                      <input type="hidden" name="invoice_id" value={d.invoice.id} />
                      <input type="hidden" name="step_id" value={d.step.id} />
                      <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                        J&apos;ai envoyé le courrier
                      </button>
                    </form>
                  ) : (
                    <form action={sendReminder}>
                      <input type="hidden" name="invoice_id" value={d.invoice.id} />
                      <input type="hidden" name="step_id" value={d.step.id} />
                      <button
                        type="submit"
                        disabled={!ready}
                        className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                      >
                        {d.retry ? "Réessayer l'envoi" : "Envoyer"}
                      </button>
                    </form>
                  )}
                </footer>
              </article>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">Journal</h2>
        {journal.length === 0 ? (
          <p className="text-sm text-muted">Aucune relance enregistrée pour l&apos;instant.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Destinataire</th>
                  <th className="px-3 py-2.5">Objet</th>
                  <th className="px-3 py-2.5">Étape</th>
                  <th className="px-3 py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((j) => {
                  const st = STATUS[j.status] ?? { label: j.status, className: "bg-slate-200 text-slate-700" };
                  return (
                    <tr key={j.id} className="border-t border-line align-top">
                      <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                        {new Date(j.sent_at ?? j.created_at).toLocaleString("fr-FR", {
                          timeZone: "Europe/Paris",
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-3 py-3">{j.to_email}</td>
                      <td className="px-3 py-3">{j.subject}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {stepLabel(j.step_days)} · {toneLabel(j.tone)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + st.className}>
                          {st.label}
                        </span>
                        {j.error && <p className="mt-1 max-w-xs text-xs text-bad">{j.error}</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
