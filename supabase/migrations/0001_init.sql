-- CollectFlow : étape 1 — entreprises, membres et sécurité par entreprise.
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index if not exists memberships_user_id_idx on public.memberships (user_id);

-- Row Level Security : chaque utilisateur ne voit que ses propres entreprises.
alter table public.companies enable row level security;
alter table public.memberships enable row level security;

-- Indique si l'utilisateur connecté appartient à l'entreprise donnée.
create or replace function public.is_member(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where company_id = cid and user_id = auth.uid()
  );
$$;

revoke all on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;

drop policy if exists "companies_select_members" on public.companies;
create policy "companies_select_members"
  on public.companies for select to authenticated
  using (public.is_member(id));

drop policy if exists "companies_update_owner" on public.companies;
create policy "companies_update_owner"
  on public.companies for update to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.company_id = companies.id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  )
  with check (char_length(name) between 2 and 120);

drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_own"
  on public.memberships for select to authenticated
  using (user_id = auth.uid());

-- Aucune politique d'insertion directe : la création passe uniquement par la
-- fonction ci-dessous, qui impose les règles (une entreprise par compte en V1).
create or replace function public.create_company(company_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clean_name text := trim(company_name);
  new_id uuid;
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;
  if char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if exists (select 1 from public.memberships where user_id = uid) then
    raise exception 'Une entreprise existe déjà pour ce compte';
  end if;

  insert into public.companies (name) values (clean_name) returning id into new_id;
  insert into public.memberships (company_id, user_id, role)
    values (new_id, uid, 'owner');

  return new_id;
end;
$$;

revoke all on function public.create_company(text) from public, anon;
grant execute on function public.create_company(text) to authenticated;
