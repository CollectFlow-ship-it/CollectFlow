import Link from "next/link";
import { redirect } from "next/navigation";
import { getCompany } from "@/lib/company";
import ImportForm from "./import-form";

export default async function ImportPage() {
  const company = await getCompany();
  if (!company) redirect("/app");

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/app/invoices" className="text-sm font-semibold text-brand">
          ← Factures
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Importer des factures</h1>
        <p className="text-muted">
          Exportez vos factures impayées depuis votre logiciel (Pennylane, Excel…) au
          format CSV, puis déposez le fichier ci-dessous. Vous vérifiez l&apos;aperçu
          avant que quoi que ce soit soit enregistré.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-white p-4 text-sm">
        <p className="mb-2 font-semibold">Colonnes attendues (une ligne par facture)</p>
        <ul className="flex flex-col gap-1 text-muted">
          <li><b className="text-ink">Client</b> : nom du client</li>
          <li><b className="text-ink">E-mail</b> : adresse où envoyer les relances</li>
          <li><b className="text-ink">Numéro de facture</b> : unique pour chaque facture</li>
          <li><b className="text-ink">Montant</b> : TTC restant dû, par exemple 1 240,50</li>
          <li><b className="text-ink">Échéance</b> : au format jj/mm/aaaa</li>
        </ul>
        <p className="mt-3 text-muted">
          Un numéro de facture déjà importé est ignoré : vous pouvez réimporter un
          fichier mis à jour sans créer de doublons.{" "}
          <a
            href="/modele-factures.csv"
            download
            className="font-semibold text-brand underline"
          >
            Télécharger un modèle
          </a>
        </p>
      </div>

      <ImportForm />
    </section>
  );
}
