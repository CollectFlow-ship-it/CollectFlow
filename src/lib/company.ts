import { createClient } from "@/lib/supabase/server";

export type CurrentCompany = { id: string; name: string };

type CompanyRow = { id: string; name: string };

// Entreprise de l'utilisateur connecté (une seule par compte en V1).
// Renvoie null s'il n'est pas connecté ou n'a pas encore créé d'entreprise.
// Une seule requête (jointure) pour limiter les allers-retours vers la base.
export async function getCompany(): Promise<CurrentCompany | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("memberships")
    .select("company_id, companies(id, name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const related = (data as { companies: CompanyRow | CompanyRow[] | null }).companies;
  const company = Array.isArray(related) ? related[0] : related;
  if (!company) return null;

  return { id: company.id, name: company.name };
}
