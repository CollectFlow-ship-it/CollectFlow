import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStripeSignature } from "@/lib/stripe";

// Stripe appelle cette adresse à chaque changement d'abonnement (essai, paiement, résiliation).
// Elle met à jour la table « subscriptions ». Rien n'est lu ni écrit sans signature valide.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  trial_end: number | null;
  current_period_end?: number | null;
  items?: { data?: { current_period_end?: number }[] };
  cancel_at_period_end?: boolean;
  cancel_at?: number | null;
  metadata?: { company_id?: string };
};

type StripeEvent = {
  id: string;
  type: string;
  created: number;
  data: { object: StripeSubscription };
};

const iso = (s: number | null | undefined) => (s ? new Date(s * 1000).toISOString() : null);

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.log("[stripe] STRIPE_WEBHOOK_SECRET n'est pas défini.");
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 500 });
  }

  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    console.log("[stripe] signature invalide : message ignoré.");
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(raw) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Message illisible." }, { status: 400 });
  }

  const handled = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];
  if (!handled.includes(event.type)) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  if (!admin) {
    console.log("[stripe] SUPABASE_SERVICE_ROLE_KEY n'est pas définie.");
    return NextResponse.json({ error: "Base non configurée." }, { status: 500 });
  }

  const sub = event.data.object;

  // L'entreprise : indiquée à la création de l'abonnement, sinon retrouvée par le client Stripe.
  let companyId = sub.metadata?.company_id ?? "";
  if (!companyId) {
    const { data } = await admin
      .from("subscriptions")
      .select("company_id")
      .eq("stripe_customer_id", sub.customer)
      .maybeSingle();
    companyId = (data?.company_id as string | undefined) ?? "";
  }
  if (!companyId) {
    console.log(`[stripe] ${event.type} : entreprise introuvable pour le client ${sub.customer}.`);
    return NextResponse.json({ received: true });
  }

  // Les messages peuvent arriver dans le désordre : on ignore un message plus ancien que le dernier appliqué.
  const { data: current } = await admin
    .from("subscriptions")
    .select("event_created")
    .eq("company_id", companyId)
    .maybeSingle();
  if (current && Number(current.event_created) > event.created) {
    return NextResponse.json({ received: true, ignored: "ancien" });
  }

  const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  const { error } = await admin.from("subscriptions").upsert(
    {
      company_id: companyId,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      status: sub.status,
      trial_end: iso(sub.trial_end),
      current_period_end: iso(periodEnd),
      // Selon la version de l'API, une résiliation programmée est signalée par l'un ou l'autre champ.
      cancel_at_period_end: Boolean(sub.cancel_at_period_end || sub.cancel_at),
      event_created: event.created,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
  if (error) {
    console.log(`[stripe] écriture impossible : ${error.message}`);
    // 500 : Stripe renverra le message plus tard.
    return NextResponse.json({ error: "Écriture impossible." }, { status: 500 });
  }

  console.log(`[stripe] ${event.type} : abonnement ${sub.status}.`);
  return NextResponse.json({ received: true });
}
