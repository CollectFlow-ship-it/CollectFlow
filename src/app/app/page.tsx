import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/company";
import { daysLate, formatEur, todayParis } from "@/lib/invoices";
import { createCompany } from "./actions";

export default async function AppHome({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const company = await getCompany();

  if (!company) {
    return (
      <section className="mx-auto flex max-w-md flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Bienvenue</h1>
          <p className="text-muted">
            Commençons par votre entreprise. Son nom apparaîtra dans les
            e-mails de relance envoyés à vos clients.
          </p>
        </div>

        {searchParams.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
            {searchParams.error}
          </p>
        )}

        <form action={createCompany} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Nom de l&apos;entreprise
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              placeholder="Studio Arnaud SARL"
              className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            Continuer
          </button>
        </form>
      </section>
    );
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("invoices")
    .select("amount_cents, due_date")
    .eq("company_id", company.id)
    .eq("status", "unpaid")
    .limit(1000);

  const today = todayParis();
  const unpaid = (data ?? []) as { amount_cents: number | string; due_date: string }[];
  const total = unpaid.reduce((s, i) => s + Number(i.amount_cents), 0);
  const overdue = unpaid.filter((i) => daysLate(i.due_date, today) > 0);
  const overdueTotal = overdue.reduce((s, i) => s + Number(i.amount_cents), 0);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{company.name}</h1>
        <p className="text-muted">Où en sont vos encaissements.</p>
      </div>

      {unpaid.length === 0 ? (
        <div className="flex max-w-xl flex-col gap-3 rounded-lg border border-line bg-white p-5">
          <p className="font-semibold">Importez vos factures impayées pour commencer.</p>
          <p className="text-sm text-muted">
            Un fichier CSV exporté de votre logiciel suffit. Vous vérifiez un
            aperçu avant l&apos;enregistrement.
          </p>
          <div>
            <Link
              href="/app/invoices/import"
              className="inline-block rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark"
            >
              Importer un fichier CSV
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="text-sm font-semibold text-muted">Total impayé</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatEur(total)}</p>
            <p className="text-sm text-muted">{unpaid.length} facture{unpaid.length > 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="text-sm font-semibold text-muted">Dont en retard</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-bad">
              {formatEur(overdueTotal)}
            </p>
            <p className="text-sm text-muted">{overdue.length} facture{overdue.length > 1 ? "s" : ""}</p>
          </div>
          <Link
            href="/app/invoices"
            className="flex flex-col justify-between rounded-lg border border-line bg-white p-4 hover:bg-brand-soft"
          >
            <p className="text-sm font-semibold text-muted">Suivi</p>
            <p className="mt-1 font-semibold text-brand">Voir les factures →</p>
          </Link>
        </div>
      )}

      <ol className="flex max-w-xl flex-col gap-2 text-sm">
        <li className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
          <span className="font-semibold text-good">Fait</span>
          Compte et entreprise créés
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
          <span className={"font-semibold " + (unpaid.length > 0 ? "text-good" : "text-brand")}>
            {unpaid.length > 0 ? "Fait" : "À faire"}
          </span>
          Importer vos factures impayées (fichier CSV)
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
          <span className="font-semibold text-brand">À faire</span>
          <Link href="/app/scenarios" className="font-semibold underline">
            Relire et adapter votre scénario de relance
          </Link>
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-muted">
          <span className="font-semibold">Bientôt</span>
          Envoyer vos premières relances
        </li>
      </ol>
    </section>
  );
}
