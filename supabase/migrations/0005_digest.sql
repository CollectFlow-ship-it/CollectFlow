-- CollectFlow : étape 5 — récapitulatif quotidien par e-mail.
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.

-- Interrupteur : recevoir ou non le récapitulatif (activé par défaut).
-- Date du dernier envoi : évite d'envoyer deux fois le même jour.
alter table public.companies
  add column if not exists digest_enabled boolean not null default true,
  add column if not exists last_digest_on date;
