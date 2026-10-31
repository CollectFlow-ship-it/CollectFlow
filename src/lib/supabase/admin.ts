import { createClient } from "@supabase/supabase-js";

// Connexion « administrateur » pour les tâches planifiées, qui n'ont pas
// d'utilisateur connecté. Elle contourne la sécurité par ligne : à n'utiliser
// que côté serveur, dans les routes protégées par un secret. La clé
// SUPABASE_SERVICE_ROLE_KEY ne doit jamais commencer par NEXT_PUBLIC_.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
