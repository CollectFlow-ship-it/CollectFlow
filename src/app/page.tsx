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
    title: "Vous importez vos factures",
    text: "Un fichier CSV exporté de votre outil de facturation suffit. Un modèle à télécharger est fourni.",
  },
  {
    title: "Vous choisissez le ton",
    text: "Quatre étapes sont prêtes, de l’amical à la mise en demeure. Chaque texte se modifie à votre façon.",
  },
  {
    title: "Vous validez, c’est envoyé",
    text: "Vous voyez les relances du jour et vous les validez une par une ou en lot. Une facture marquée payée n’est plus relancée.",
  },
];

const FEATURES = [
  {
    title: "Le ton monte d’un cran à chaque étape",
    text: "Le premier rappel reste aimable. Les suivants deviennent plus formels, sans que vous ayez à les réécrire.",
  },
  {
    title: "Les pénalités de retard sont calculées",
    text: "Taux annuel et indemnité forfaitaire sont réglables. Le montant exact est ajouté au texte à chaque relance.",
  },
  {
    title: "Jamais deux fois le même e-mail",
    text: "Une relance part une seule fois par facture et par étape, même si vous cliquez deux fois.",
  },
  {
    title: "La mise en demeure part par courrier",
    text: "La dernière étape n’est pas envoyée par e-mail. Elle vous rappelle de poster un courrier recommandé, et vous la cochez une fois fait.",
  },
  {
    title: "Les réponses arrivent chez vous",
    text: "Vos clients répondent à l’adresse que vous choisissez, pas à une boîte que vous ne lisez pas.",
  },
  {
    title: "Un expéditeur qui inspire confiance",
    text: "L’e-mail s’affiche au nom de votre entreprise, depuis un domaine authentifié, pour arriver en boîte principale.",
  },
];

function Check() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2.5 7.5l3 3 6-7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Home() {
  return (
    <div className="bg-white">
      <header>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" aria-label="CollectFlow, accueil">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link
              href="/login"
              className="rounded-full px-4 py-2.5 hover:bg-brand-soft"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-brand px-5 py-2.5 text-white hover:bg-brand-dark"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Héros : un message chaleureux et le produit lui-même */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-16">
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Votre outil de relance des factures impayées.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              CollectFlow envoie des relances courtoises au bon moment, du
              rappel amical à la mise en demeure. Vous gardez la main : rien
              ne part sans votre validation.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-brand px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
              >
                Créer mon compte
              </Link>
              <Link
                href="/login"
                className="rounded-full border-2 border-brand/20 bg-white px-7 py-3 font-semibold text-brand hover:bg-brand-soft"
              >
                Se connecter
              </Link>
            </div>
            <p className="text-sm text-muted">
              Import CSV, relances par e-mail. Rien à installer.
            </p>
          </div>

          <figure
            aria-label="Exemple de scénario de relance"
            className="relative isolate min-w-0"
          >
            <div
              aria-hidden="true"
              className="absolute -right-6 -top-8 -z-10 h-56 w-56 rounded-full bg-brand-soft sm:h-72 sm:w-72"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-8 -left-6 -z-10 h-40 w-40 rounded-full bg-sun sm:h-52 sm:w-52"
            />
            <div className="rounded-[2rem] border border-line/70 bg-white p-6 shadow-xl shadow-brand/10 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                  <p className="font-display text-lg font-bold">
                    Facture F-2026-0142
                  </p>
                  <p className="text-sm text-muted">
                    Atelier Morel, échue le 12/10/2026
                  </p>
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
                            "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold " +
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
                          <div className="mt-3 rounded-2xl bg-canvas p-4 text-sm leading-relaxed">
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
                            <p className="mt-3 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">
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
            <figcaption className="mt-4 text-sm text-muted">
              Exemple de scénario. Les délais, les textes et les pénalités se
              règlent dans l’application.
            </figcaption>
          </figure>
        </section>

        {/* Fonctionnement : une vraie séquence */}
        <section className="bg-canvas">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <h2 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Trois gestes, puis on s’occupe du reste.
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {HOW.map((h, i) => (
                <li
                  key={h.title}
                  className="flex flex-col gap-3 rounded-[1.75rem] bg-white p-7 shadow-sm shadow-brand/5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand font-display text-lg font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl font-bold">{h.title}</h3>
                  <p className="leading-relaxed text-muted">{h.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ce que fait l’outil */}
        <section className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
          <h2 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ferme sur le fond, aimable dans la forme.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Vos clients restent vos clients. Relancer coûte du temps et un peu
            de gêne : CollectFlow s’en charge avec un cadre clair, et vous
            gardez la main à chaque envoi.
          </p>
          <ul className="mt-12 grid gap-x-12 gap-y-9 md:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <Check />
                <div>
                  <h3 className="font-display text-lg font-bold">{f.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 lg:pb-24">
          <div className="flex flex-col items-start gap-6 rounded-[2rem] bg-brand p-8 text-white sm:p-12 md:flex-row md:items-center md:justify-between">
            <h2 className="max-w-xl font-display text-3xl font-extrabold tracking-tight">
              On commence par vos trois factures les plus en retard ?
            </h2>
            <Link
              href="/signup"
              className="rounded-full bg-white px-7 py-3.5 font-semibold text-brand hover:bg-brand-soft"
            >
              Créer mon compte
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted">
          <Logo size={26} />
          <p>© 2026 CollectFlow</p>
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Se connecter
          </Link>
        </div>
      </footer>
    </div>
  );
}
