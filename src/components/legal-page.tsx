import Link from "next/link";
import { Logo } from "@/components/logo";
import { LEGAL } from "@/lib/legal";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link href="/" aria-label="CollectFlow, accueil">
          <Logo />
        </Link>
        <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-brand-soft">
          Se connecter
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : {LEGAL.updatedOn}</p>
        <div className="mt-8 flex flex-col gap-4 leading-relaxed [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_a]:font-semibold [&_a]:text-brand [&_a]:underline">
          {children}
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}

export function LegalFooter() {
  return (
    <footer className="border-t border-line">
      <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-5 py-6 text-sm text-muted">
        <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
        <Link href="/conditions" className="hover:underline">Conditions d’utilisation</Link>
        <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
      </nav>
    </footer>
  );
}
