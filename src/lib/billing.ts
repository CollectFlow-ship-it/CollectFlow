import { createClient } from "@/lib/supabase/server";

export type Subscription = {
  status: string;
  stripe_customer_id: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

// Tant que BILLING_REQUIRED n'est pas « true », tout le monde garde l'accès :
// on peut tester Stripe en mode test sans bloquer personne.
export function billingRequired(): boolean {
  return process.env.BILLING_REQUIRED === "true";
}

// « past_due » = dernier paiement refusé : Stripe réessaie, on laisse l'accès pendant ce temps.
const ACCESS_STATUSES = ["trialing", "active", "past_due"];

export function statusGivesAccess(status: string | null | undefined): boolean {
  return ACCESS_STATUSES.includes(status ?? "");
}

export async function getSubscription(companyId: string): Promise<Subscription | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, stripe_customer_id, trial_end, current_period_end, cancel_at_period_end")
    .eq("company_id", companyId)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

export async function hasAccess(companyId: string): Promise<boolean> {
  if (!billingRequired()) return true;
  const sub = await getSubscription(companyId);
  return statusGivesAccess(sub?.status);
}
