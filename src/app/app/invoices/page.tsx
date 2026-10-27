import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/company";
import {
  daysLate,
  formatDate,
  formatEur,
  severity,
  todayParis,
  type Invoice,
  type Severity,
} from "@/lib/invoices";
import { deleteInvoice, markPaid, markUnpaid, setPaused } from "./actions";

type Filter = "unpaid" | "late" | "paused" | "paid";

const TABS: { key: Filter; label: string }[] = [
  { key: "unpaid", label: "Impayées" },
  { key: "late", label: "En retard" },
  { key: "paused", label: "En pause" },
  { key: "paid", label: "Payées" },
];

const BADGE: Record<Severity, string> = {
  notdue: "bg-brand-soft text-brand",
  light: "bg-amber-100 text-amber-800",
  medium: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-bad",
};

function lateLabel(late: number): string {
  if (late > 0) return `${late} j de retard`;
  if (late === 0) return "Échéance aujourd'hui";
  return `Dans ${-late} j`;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: {
    filter?: string;
    q?: string;
    imported?: string;
    skipped?: string;
  };
}) {
  const company = await getCompany();
  if (!company) redirect("/app");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, client_name, client_email, invoice_number, amount_cents, due_date, status, paused, paid_at",
    )
    .eq("company_id", company.id)
    .order("due_date", { ascending: true })
    .limit(1000);

  const all = ((data ?? []) as Invoice[]).map((i) => ({
    ...i,
    amount_cents: Number(i.amount_cents),
  }));
  const today = todayParis();

  const unpaid = all.filter((i) => i.status === "unpaid");
  const counts: Record<Filter, number> = {
    unpaid: unpaid.length,
    late: unpaid.filter((i) => daysLate(i.due_date, today) > 0).length,
    paused: unpaid.filter((i) => i.paused).length,
    paid: all.filter((i) => i.status === "paid").length,
  };

  const filter: Filter = TABS.some((t) => t.key === searchParams.filter)
    ? (searchParams.filter as Filter)
    : "unpaid";
  const q = (searchParams.q ?? "").trim().toLowerCase().slice(0, 100);

  let list = all.filter((i) => {
    if (filter === "paid") return i.status === "paid";
    if (i.status !== "unpaid") return false;
    if (filter === "late") return daysLate(i.due_date, today) > 0;
    if (filter === "paused") return i.paused;
    return true;
  });
  if (q) {
    list = list.filter((i) =>
      `${i.client_name} ${i.invoice_number} ${i.client_email}`.toLowerCase().includes(q),
    );
  }
  if (filter === "paid") {
    list = [...list].sort((a, b) => (b.paid_at ?? "").localeCompare(a.paid_at ?? ""));
  }

  const totalCents = list.reduce((sum, i) => sum + i.amount_cents, 0);
  const imported = Number(searchParams.imported);
  const skipped = Number(searchParams.skipped);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Factures</h1>
          <p className="text-muted">
            Suivez vos impayés, mettez des relances en pause, marquez les paiements reçus.
          </p>
        </div>
        <Link
          href="/app/invoices/import"
          className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Importer un fichier CSV
        </Link>
      </div>

      {Number.isFinite(imported) && searchParams.imported !== undefined && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">
          {imported} facture{imported > 1 ? "s" : ""} importée{imported > 1 ? "s" : ""}
          {skipped > 0
            ? `, ${skipped} ignorée${skipped > 1 ? "s" : ""} (numéro déjà connu).`
            : "."}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          Impossible de charger les factures. Rechargez la page.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtres" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/app/invoices?filter=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={filter === t.key ? "page" : undefined}
              className={
                "rounded-full border px-3 py-1.5 text-sm font-semibold " +
                (filter === t.key
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white hover:bg-brand-soft")
              }
            >
              {t.label} <span className="tabular-nums opacity-80">{counts[t.key]}</span>
            </Link>
          ))}
        </nav>
        <form method="get" className="flex gap-2">
          <input type="hidden" name="filter" value={filter} />
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Client ou n° de facture"
            aria-label="Rechercher"
            className="w-56 max-w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold hover:bg-brand-soft"
          >
            Rechercher
          </button>
        </form>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-line bg-white px-5 py-10 text-center text-muted">
          {all.length === 0 ? (
            <>
              Aucune facture pour l&apos;instant.{" "}
              <Link href="/app/invoices/import" className="font-semibold text-brand underline">
                Importez votre premier fichier CSV.
              </Link>
            </>
          ) : (
            "Aucune facture ne correspond à ce filtre."
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2.5">Client</th>
                <th className="px-3 py-2.5">N° facture</th>
                <th className="px-3 py-2.5 text-right">Montant</th>
                <th className="px-3 py-2.5">Échéance</th>
                <th className="px-3 py-2.5">{filter === "paid" ? "Payée le" : "Retard"}</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => {
                const late = daysLate(i.due_date, today);
                return (
                  <tr key={i.id} className="border-t border-line align-middle">
                    <td className="px-3 py-3">
                      <div className="font-semibold">{i.client_name}</div>
                      <div className="text-xs text-muted">{i.client_email}</div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{i.invoice_number}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {formatEur(i.amount_cents)}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{formatDate(i.due_date)}</td>
                    <td className="px-3 py-3">
                      {i.status === "paid" ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-good">
                          {i.paid_at
                            ? new Date(i.paid_at).toLocaleDateString("fr-FR", {
                                timeZone: "Europe/Paris",
                              })
                            : "Payée"}
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={
                              "whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                              BADGE[severity(late)]
                            }
                          >
                            {lateLabel(late)}
                          </span>
                          {i.paused && (
                            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                              En pause
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {i.status === "unpaid" ? (
                          <>
                            <form action={setPaused}>
                              <input type="hidden" name="id" value={i.id} />
                              <input type="hidden" name="paused" value={String(!i.paused)} />
                              <button
                                type="submit"
                                className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-brand-soft"
                              >
                                {i.paused ? "Reprendre" : "Mettre en pause"}
                              </button>
                            </form>
                            <form action={markPaid}>
                              <input type="hidden" name="id" value={i.id} />
                              <button
                                type="submit"
                                className="rounded-lg bg-good px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                              >
                                Marquer payée
                              </button>
                            </form>
                          </>
                        ) : (
                          <form action={markUnpaid}>
                            <input type="hidden" name="id" value={i.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-brand-soft"
                            >
                              Remettre en impayée
                            </button>
                          </form>
                        )}
                        <details>
                          <summary className="cursor-pointer list-none rounded-lg px-2 py-1.5 text-xs font-semibold text-muted hover:bg-canvas">
                            Supprimer
                          </summary>
                          <form
                            action={deleteInvoice}
                            className="mt-1 flex w-52 flex-col gap-2 rounded-lg border border-line bg-white p-3 text-left"
                          >
                            <input type="hidden" name="id" value={i.id} />
                            <p className="text-xs text-muted">
                              Supprimer définitivement la facture {i.invoice_number} ?
                            </p>
                            <button
                              type="submit"
                              className="rounded-lg bg-bad px-2.5 py-1.5 text-xs font-semibold text-white"
                            >
                              Oui, supprimer
                            </button>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-canvas">
                <td className="px-3 py-2.5 font-semibold" colSpan={2}>
                  {list.length} facture{list.length > 1 ? "s" : ""}
                </td>
                <td className="px-3 py-2.5 text-right font-extrabold tabular-nums">
                  {formatEur(totalCents)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
