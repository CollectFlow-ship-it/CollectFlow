import { getCompany } from "@/lib/company";
import { billingRequired, getSubscription, statusGivesAccess } from "@/lib/billing";
import { stripeConfigured } from "@/lib/stripe";
import { openPortal, startCheckout } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  trialing: "Essai gratuit en cours",
  active: "Abonnement actif",
  past_due: "Paiement en attente",
  canceled: "Abonnement résilié",
  unpaid: "Abonnement impayé",
  incomplete: "Paiement non finalisé",
  incomplete_expired: "Paiement expiré",
  paused: "Abonnement en pause",
  none: "Pas d’abonnement",
};

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; canceled?: string; need?: string; already?: string };
}) {
  const company = await getCompany();
  if (!company) {
    return <p className="text-muted">Créez d’abord votre entreprise depuis l’accueil.</p>;
  }

  const sub = await getSubscription(company.id);
  const ready = stripeConfigured();
  const active = statusGivesAccess(sub?.status);
  const trialDays = Number(process.env.STRIPE_TRIAL_DAYS ?? 14) || 0;

  return (
    <section className="flex max-w-xl flex-col gap-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Abonnement</h1>

      {searchParams.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad">
          {searchParams.error}
        </p>
      )}
      {searchParams.need && !active && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          L’envoi des relances demande un abonnement actif.
        </p>
      )}
      {searchParams.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">
          ✓ Merci ! Votre abonnement est en cours d’activation. Il apparaît ici dans quelques
          secondes : rafraîchissez la page si besoin.
        </p>
      )}
      {searchParams.canceled && (
        <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-muted">
          Paiement annulé. Rien n’a été prélevé.
        </p>
      )}
      {searchParams.already && (
        <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-muted">
          Vous avez déjà un abonnement actif.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-line bg-white p-6">
        <p className="text-sm font-semibold text-muted">Votre situation</p>
        <p className="font-display text-xl font-bold">{STATUS_LABEL[sub?.status ?? "none"] ?? sub?.status}</p>
        {sub?.status === "trialing" && sub.trial_end && (
          <p className="text-sm text-muted">
            {sub.cancel_at_period_end
              ? `Résiliation programmée : l’accès s’arrête le ${fmt(sub.trial_end)}, sans aucun paiement.`
              : `Fin de l’essai : ${fmt(sub.trial_end)}. Le premier paiement a lieu à cette date.`}
          </p>
        )}
        {sub?.status === "active" && sub.current_period_end && (
          <p className="text-sm text-muted">
            {sub.cancel_at_period_end
              ? `Résiliation programmée : l’accès s’arrête le ${fmt(sub.current_period_end)}.`
              : `Prochain paiement : ${fmt(sub.current_period_end)}.`}
          </p>
        )}
        {sub?.status === "past_due" && (
          <p className="text-sm text-bad">Le dernier paiement a échoué. Mettez à jour votre carte pour garder l’accès.</p>
        )}
        {!billingRequired() && (
          <p className="text-sm text-muted">Pour l’instant, l’accès à CollectFlow n’est pas limité.</p>
        )}
      </div>

      {!ready && (
        <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-muted">
          Le paiement n’est pas encore ouvert.
        </p>
      )}

      {ready && !active && (
        <form action={startCheckout} className="flex flex-col gap-3">
          <button
            type="submit"
            className="rounded-full bg-brand px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
          >
            {trialDays > 0 ? `Commencer l’essai gratuit de ${trialDays} jours` : "S’abonner"}
          </button>
          <p className="text-sm text-muted">
            Le paiement se fait sur la page sécurisée de Stripe. Vous pouvez résilier à tout moment.
          </p>
        </form>
      )}

      {ready && sub?.stripe_customer_id && (
        <form action={openPortal}>
          <button
            type="submit"
            className="rounded-full border-2 border-brand/20 bg-white px-6 py-3 font-semibold text-brand hover:bg-brand-soft"
          >
            Gérer mon abonnement et mes factures
          </button>
        </form>
      )}
    </section>
  );
}
