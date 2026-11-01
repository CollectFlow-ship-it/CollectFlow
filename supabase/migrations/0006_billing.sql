-- CollectFlow : étape 6 — abonnement Stripe.
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.

-- Une ligne par entreprise : état de son abonnement, tenu à jour par Stripe.
-- Table séparée de « companies » exprès : le propriétaire peut modifier sa fiche
-- entreprise, il ne doit surtout pas pouvoir se déclarer abonné lui-même.
create table if not exists public.subscriptions (
  company_id uuid primary key references public.companies (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  status text not null default 'none',
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  event_created bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Lecture seule pour les membres. Aucune règle d'écriture : seules les routes
-- serveur (clé service_role) peuvent créer ou modifier une ligne.
drop policy if exists "subscriptions_select_members" on public.subscriptions;
create policy "subscriptions_select_members"
  on public.subscriptions for select to authenticated
  using (public.is_member(company_id));
