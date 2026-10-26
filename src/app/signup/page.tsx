import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-5 py-12">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-sm font-semibold text-brand">
          CollectFlow
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Créer un compte</h1>
      </div>

      {searchParams.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          {searchParams.error}
        </p>
      )}

      <form action={signup} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Adresse e-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Mot de passe
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
          />
          <span className="text-xs font-normal text-muted">8 caractères minimum.</span>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Créer mon compte
        </button>
      </form>

      <p className="text-sm text-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-brand underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
