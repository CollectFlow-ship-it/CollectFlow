"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCompany(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2 || name.length > 120) {
    redirect(
      "/app?error=" +
        encodeURIComponent("Le nom de l'entreprise doit faire entre 2 et 120 caractères."),
    );
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("create_company", { company_name: name });

  if (error) {
    redirect(
      "/app?error=" +
        encodeURIComponent("Impossible de créer l'entreprise. Réessayez dans un instant."),
    );
  }

  revalidatePath("/app");
  redirect("/app");
}
