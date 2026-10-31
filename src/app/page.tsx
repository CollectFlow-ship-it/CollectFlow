import Link from "next/link";
import { Logo } from "@/components/logo";

// Exemple de scénario affiché dans le héros : mêmes étapes que les réglages par défaut.
const EXAMPLE_STEPS = [
  { delay: "J+3", tone: "Amical", date: "15/10", state: "sent" },
  { delay: "J+10", tone: "Formel", date: "22/10", state: "sent" },
  { delay: "J+20", tone: "Ferme", date: "01/11", state: "next" },
  { delay: "J+35", tone: "Mise en demeure", date: "16/11", state: "letter" },
] as const;

const TONE_STYLE: Record<string, string> = {
  Amical: "bg-brand-soft text-brand",
  Formel: "bg-amber-100 text-amber-800",
  Ferme: "bg-orange-100 text-orange-800",
  "Mise en demeure": "bg-red-100 text-bad",
};

const HOW = [
  {
    title: "Importez vos factures",
    text: "Un fichier CSV exporté de votre outil de facturation suffit. Un modèle à télécharger est fourni.",
  },
  {
    title: "Choisissez le ton",
    text: "Quatre étapes sont prêtes, de l’amical à la mise en demeure. Chaque texte se modifie à votre façon.",
  },
  {
    title: "Validez, c’est envoyé",
    text: "Vous voyez les relances du jour et vous les validez une par une ou en lot. Une facture marquée payée n’est plus relancée.",
  },
];

const FEATURES = [
  {
    title: "Le ton monte d’un cran à chaque étape",
    text: "Le premier rappel reste aimable. Les suivants deviennent plus formels, sans que vous ayez à les réécrire.",
  },
  {
    title: "Pénalités de retard calculées",
    text: "Taux annuel et indemnité forfaitaire sont réglables. Le montant exact est ajouté au texte à chaque relance.",
  },
  {
    title: "Jamais deux fois le même e-mail",
    text: "Une relance part une seule fois par facture et par étape, même si vous cliquez deux fois.",
  },
  {
    title: "Mise en demeure par courrier recommandé",
    text: "La dernière étape n’est pas envoyée par e-mail. Elle vous rappelle de poster le courrier, et vous la cochez une fois fait.",
  },
  {
    title: "Les réponses arrivent chez vous",
    text: "Vos clients répondent à l’adresse que vous choisissez, pas à une boîte que vous ne lisez pas.",
  },
  {
    title: "Un expéditeur clair",
    text: "L’e-mail s’affiche au nom de votre entreprise, depuis un domaine authentifié, pour arriver en boîte principale.",
  },
];

export default function Home() {
  return (
    <div className="bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" aria-label="CollectFlow, accueil">
            <Logo />
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 hover:bg-brand-soft"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-dark"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Héros : le produit lui-même, une facture qui monte d’un cran à chaque relance */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Relancez vos factures impayées sans y passer vos soirées.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              CollectFlow prépare chaque relance au bon moment, avec un ton qui
              monte d’un cran à chaque étape. Vous validez, il envoie.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
              >
                Créer un compte
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-line bg-white px-6 py-3 font-semibold hover:bg-brand-soft"
              >
                Se connecter
              </Link>
            </div>
            <p className="text-sm text-muted">
              Import CSV, relances par e-mail. Rien à installer.
            </p>
          </div>

          <figure aria-label="Exemple de scénario de relance" className="min-w-0">
            <div className="rounded-2xl border border-line bg-canvas p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                  <p className="font-display text-lg font-bold">
                    Facture F-2026-0142
                  </p>
                  <p className="text-sm text-muted">Atelier Morel, échue le 12/10/2026</p>
                </div>
                <p className="font-display text-2xl font-extrabold tabular-nums">
                  1 480,00 €
                </p>
              </div>

              <ol className="mt-6 flex flex-col">
                {EXAMPLE_STEPS.map((s, i) => {
                  const last = i === EXAMPLE_STEPS.length - 1;
                  const done = s.state === "sent";
                  const next = s.state === "next";
                  return (
                    <li key={s.delay} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={
                            "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold " +
                            (done
                              ? "border-brand bg-brand text-white"
                              : next
                                ? "border-brand bg-white text-brand"
                                : "border-line bg-white text-muted")
                          }
                          aria-hidden="true"
                        >
                          {done ? "✓" : ""}
                        </span>
                        {!last && (
                          <span
                            className={
                              "w-0.5 flex-1 " + (done ? "bg-brand" : "bg-line")
                            }
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className={"min-w-0 flex-1 " + (last ? "" : "pb-5")}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-display font-bold">
                            {s.delay}
                          </span>
                          <span
                            className={
                              "rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                              TONE_STYLE[s.tone]
                            }
                          >
                            {s.tone}
                          </span>
                          <span className="text-sm text-muted">
                            {done && `envoyée le ${s.date}`}
                            {next && `à valider, prévue le ${s.date}`}
                            {s.state === "letter" &&
                              `courrier recommandé, à poster vers le ${s.date}`}
                          </span>
                        </div>

                        {next && (
                          <div className="mt-3 rounded-xl border border-line bg-white p-4 text-sm leading-relaxed">
                            <p className="font-semibold">
                              Objet : facture F-2026-0142, troisième relance
                            </p>
                            <p className="mt-2 text-muted">
                              Bonjour, la facture F-2026-0142 de 1 480,00 €,
                              échue le 12/10/2026, reste impayée à ce jour
                              (20 jours de retard). Les pénalités de retard
                              s’élèvent à{" "}
                              <span className="font-semibold text-ink">
                                48,11 €
                              </span>
                              . Merci de procéder au règlement sous huit jours.
                            </p>
                            <p className="mt-3 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white">
                              Valider et envoyer
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <figcaption className="mt-3 text-sm text-muted">
              Exemple de scénario. Les délais, les textes et les pénalités se
              règlent dans l’application.
            </figcaption>
          </figure>
        </section>

        {/* Fonctionnement : une vraie séquence */}
        <section className="border-t border-line bg-canvas">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <h2 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Trois gestes, puis les relances partent d’elles-mêmes.
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {HOW.map((h, i) => (
                <li key={h.title} className="flex flex-col gap-2 border-t-2 border-brand pt-4">
                  <span className="font-display text-sm font-bold text-brand">
                    Étape {i + 1}
                  </span>
                  <h3 className="font-display text-xl font-bold">{h.title}</h3>
                  <p className="text-muted">{h.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ce que fait l’outil */}
        <section className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <h2 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ferme avec le client, discret avec la relation.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Relancer coûte du temps et un peu de gêne. CollectFlow s’en charge
            avec un cadre clair, et vous gardez la main à chaque envoi.
          </p>
          <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="border-t border-line pt-4">
                <dt className="font-display text-lg font-bold">{f.title}</dt>
                <dd className="mt-1 text-muted">{f.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-brand text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between">
            <h2 className="max-w-xl font-display text-3xl font-extrabold tracking-tight">
              Commencez par vos trois factures les plus en retard.
            </h2>
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-brand hover:bg-brand-soft"
            >
              Créer un compte
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted">
          <Logo size={24} />
          <p>© 2026 CollectFlow</p>
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Se connecter
          </Link>
        </div>
      </footer>
    </div>
  );
}
