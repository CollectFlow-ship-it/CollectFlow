-- CollectFlow : étape 3 — scénarios de relance et réglages de l'entreprise.
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.

-- Réglages utilisés dans les e-mails (pénalités, instructions de paiement).
alter table public.companies
  add column if not exists penalty_rate numeric(5, 2) not null default 10
    check (penalty_rate >= 0 and penalty_rate <= 100),
  add column if not exists fixed_fee_cents integer not null default 4000
    check (fixed_fee_cents >= 0 and fixed_fee_cents <= 100000),
  add column if not exists payment_instructions text not null default ''
    check (char_length(payment_instructions) <= 600);

-- Étapes du scénario : un e-mail envoyé N jours après l'échéance (N négatif =
-- avant l'échéance).
create table if not exists public.reminder_steps (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  days_after_due integer not null check (days_after_due between -30 and 180),
  tone text not null check (tone in ('amical', 'formel', 'ferme', 'mise_en_demeure')),
  subject text not null check (char_length(subject) between 1 and 200 and subject !~ '[\r\n]'),
  body text not null check (char_length(body) between 1 and 5000),
  enabled boolean not null default true,
  formal_notice boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, days_after_due)
);

create index if not exists reminder_steps_company_idx
  on public.reminder_steps (company_id, days_after_due);

alter table public.reminder_steps enable row level security;

drop policy if exists "steps_select_members" on public.reminder_steps;
create policy "steps_select_members"
  on public.reminder_steps for select to authenticated
  using (public.is_member(company_id));

drop policy if exists "steps_insert_members" on public.reminder_steps;
create policy "steps_insert_members"
  on public.reminder_steps for insert to authenticated
  with check (public.is_member(company_id));

drop policy if exists "steps_update_members" on public.reminder_steps;
create policy "steps_update_members"
  on public.reminder_steps for update to authenticated
  using (public.is_member(company_id))
  with check (public.is_member(company_id));

drop policy if exists "steps_delete_members" on public.reminder_steps;
create policy "steps_delete_members"
  on public.reminder_steps for delete to authenticated
  using (public.is_member(company_id));

-- Met à jour la date de modification à chaque changement.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reminder_steps_touch on public.reminder_steps;
create trigger reminder_steps_touch
  before update on public.reminder_steps
  for each row execute function public.touch_updated_at();
