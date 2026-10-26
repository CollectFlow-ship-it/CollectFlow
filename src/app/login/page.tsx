import Link from "next/link";
import { login } from "@/app/auth/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-5 py-12">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-sm font-semibold text-brand">
          CollectFlow
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Connexion</h1>
      </div>

      {searchParams.message && (
        <p role="status" className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
          {searchParams.message}
        </p>
      )}
      {searchParams.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          {searchParams.error}
        </p>
      )}

      <form action={login} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            required
            className="rounded-lg border border-line bg-white px-3 py-2 font-normal"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Se connecter
        </button>
      </form>

      <p className="text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-semibold text-brand underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
