"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCompany } from "@/lib/company";
import { getSubscription, statusGivesAccess } from "@/lib/billing";
import { stripeConfigured, stripeRequest } from "@/lib/stripe";

function back(params: Record<string, string>): never {
  redirect(`/app/billing?${new URLSearchParams(params).toString()}`);
}

function appUrl(): string {
  return (process.env.APP_URL || "https://www.collectflow.fr").replace(/\/$/, "");
}

// Retrouve le client Stripe de l'entreprise, ou le crée au premier achat.
async function ensureCustomer(companyId: string, companyName: string, email: string) {
  const sub = await getSubscription(companyId);
  if (sub?.stripe_customer_id) return sub.stripe_customer_id;

  const admin = createAdminClient();
  if (!admin) return null;
  const created = await stripeRequest<{ id: string }>("POST", "/customers", {
    email,
    name: companyName,
    metadata: { company_id: companyId },
  });
  if (!created.ok) return null;

  const { error } = await admin
    .from("subscriptions")
    .upsert({ company_id: companyId, stripe_customer_id: created.data.id }, { onConflict: "company_id" });
  if (error) return null;
  return created.data.id;
}

export async function startCheckout() {
  if (!stripeConfigured()) back({ error: "Le paiement n'est pas encore configuré." });

  const company = await getCompany();
  if (!company) redirect("/app");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const existing = await getSubscription(company!.id);
  if (statusGivesAccess(existing?.status)) back({ already: "1" });

  const customer = await ensureCustomer(company!.id, company!.name, user!.email!);
  if (!customer) back({ error: "Impossible de préparer le paiement. Réessayez dans un instant." });

  const trialDays = Math.max(0, Math.min(90, Number(process.env.STRIPE_TRIAL_DAYS ?? 14) || 0));
  const session = await stripeRequest<{ url?: string }>("POST", "/checkout/sessions", {
    mode: "subscription",
    customer,
    client_reference_id: company!.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: {
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      metadata: { company_id: company!.id },
    },
    allow_promotion_codes: true,
    locale: "fr",
    success_url: `${appUrl()}/app/billing?success=1`,
    cancel_url: `${appUrl()}/app/billing?canceled=1`,
  });
  if (!session.ok || !session.data.url) {
    back({ error: session.ok ? "Stripe n'a pas renvoyé de page de paiement." : session.error });
  }
  redirect(session.data.url!);
}

// Page Stripe où le client change sa carte, télécharge ses factures ou résilie.
export async function openPortal() {
  if (!stripeConfigured()) back({ error: "Le paiement n'est pas encore configuré." });
  const company = await getCompany();
  if (!company) redirect("/app");

  const sub = await getSubscription(company!.id);
  if (!sub?.stripe_customer_id) back({ error: "Aucun abonnement à gérer pour l'instant." });

  const portal = await stripeRequest<{ url?: string }>("POST", "/billing_portal/sessions", {
    customer: sub!.stripe_customer_id,
    return_url: `${appUrl()}/app/billing`,
  });
  if (!portal.ok || !portal.data.url) {
    back({ error: portal.ok ? "Stripe n'a pas renvoyé de page." : portal.error });
  }
  redirect(portal.data.url!);
}
