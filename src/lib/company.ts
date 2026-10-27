import { createClient } from "@/lib/supabase/server";

export type CurrentCompany = { id: string; name: string };

// Entreprise de l'utilisateur connecté (une seule par compte en V1).
// Renvoie null s'il n'est pas connecté ou n'a pas encore créé d'entreprise.
export async function getCompany(): Promise<CurrentCompany | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", membership.company_id as string)
    .maybeSingle();
  if (!company) return null;

  return { id: company.id as string, name: company.name as string };
}
