-- CollectFlow : étape 4 — journal des relances et e-mail de réponse.
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.

-- Adresse où arrivent les réponses de vos clients (Reply-To des relances).
alter table public.companies
  add column if not exists reply_to_email text
    check (
      reply_to_email is null
      or (
        char_length(reply_to_email) <= 254
        and reply_to_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
      )
    );

-- Journal : une ligne par couple (facture, étape). La contrainte d'unicité
-- empêche d'envoyer deux fois la même relance, même en cas de double clic.
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  step_id uuid references public.reminder_steps (id) on delete set null,
  step_days integer not null,
  tone text not null,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null check (status in ('sending', 'sent', 'failed', 'skipped', 'manual')),
  attempts integer not null default 1,
  provider_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invoice_id, step_id)
);

create index if not exists reminders_company_created_idx
  on public.reminders (company_id, created_at desc);

alter table public.reminders enable row level security;

drop policy if exists "reminders_select_members" on public.reminders;
create policy "reminders_select_members"
  on public.reminders for select to authenticated
  using (public.is_member(company_id));

drop policy if exists "reminders_insert_members" on public.reminders;
create policy "reminders_insert_members"
  on public.reminders for insert to authenticated
  with check (public.is_member(company_id));

drop policy if exists "reminders_update_members" on public.reminders;
create policy "reminders_update_members"
  on public.reminders for update to authenticated
  using (public.is_member(company_id))
  with check (public.is_member(company_id));

-- Pas de politique de suppression : le journal ne s'efface pas depuis l'application.

drop trigger if exists reminders_touch on public.reminders;
create trigger reminders_touch
  before update on public.reminders
  for each row execute function public.touch_updated_at();
