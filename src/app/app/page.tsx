import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCompany } from "./actions";

type Company = { id: string; name: string };

export default async function AppHome({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("memberships")
    .select("role, companies(id, name)")
    .eq("user_id", user.id)
    .limit(1);

  const row = (data as { companies: Company | Company[] | null }[] | null)?.[0];
  const related = row?.companies;
  const company = Array.isArray(related) ? related[0] : related;

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

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{company.name}</h1>
        <p className="text-muted">Votre espace est prêt. Voici les prochaines étapes du produit.</p>
      </div>

      <ol className="flex max-w-xl flex-col gap-2 text-sm">
        <li className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
          <span className="font-semibold text-good">Fait</span>
          Compte et entreprise créés
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-muted">
          <span className="font-semibold">Bientôt</span>
          Importer vos factures impayées (fichier CSV)
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-muted">
          <span className="font-semibold">Bientôt</span>
          Choisir votre scénario de relance
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-muted">
          <span className="font-semibold">Bientôt</span>
          Envoyer vos premières relances
        </li>
      </ol>
    </section>
  );
}
