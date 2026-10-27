-- CollectFlow : étape 2 — factures impayées.
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  client_name text not null check (char_length(client_name) between 1 and 200),
  client_email text not null check (
    char_length(client_email) <= 254
    and client_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  invoice_number text not null check (char_length(invoice_number) between 1 and 80),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 99999999999),
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  paused boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, invoice_number)
);

create index if not exists invoices_company_status_due_idx
  on public.invoices (company_id, status, due_date);

alter table public.invoices enable row level security;

-- Un utilisateur ne voit et ne modifie que les factures de son entreprise.
drop policy if exists "invoices_select_members" on public.invoices;
create policy "invoices_select_members"
  on public.invoices for select to authenticated
  using (public.is_member(company_id));

drop policy if exists "invoices_insert_members" on public.invoices;
create policy "invoices_insert_members"
  on public.invoices for insert to authenticated
  with check (public.is_member(company_id));

drop policy if exists "invoices_update_members" on public.invoices;
create policy "invoices_update_members"
  on public.invoices for update to authenticated
  using (public.is_member(company_id))
  with check (public.is_member(company_id));

drop policy if exists "invoices_delete_members" on public.invoices;
create policy "invoices_delete_members"
  on public.invoices for delete to authenticated
  using (public.is_member(company_id));
