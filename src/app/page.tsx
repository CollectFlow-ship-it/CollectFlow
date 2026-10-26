import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-5 py-16">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-brand">CollectFlow</p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Les factures impayées se relancent toutes seules.
        </h1>
        <p className="text-muted">
          Importez vos factures, choisissez le ton de vos relances, et
          CollectFlow s&apos;occupe des rappels par e-mail jusqu&apos;au
          paiement.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Créer un compte
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-line bg-white px-5 py-2.5 font-semibold hover:bg-brand-soft"
        >
          Se connecter
        </Link>
      </div>
    </main>
  );
}
