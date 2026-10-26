"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function frenchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirmez d'abord votre adresse e-mail grâce au lien que nous vous avons envoyé.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cette adresse e-mail.";
  if (m.includes("password"))
    return "Le mot de passe est trop faible. Utilisez au moins 8 caractères.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  return "Une erreur est survenue. Réessayez dans un instant.";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isEmail(email) || !password) {
    redirect("/login?error=" + encodeURIComponent("Renseignez votre e-mail et votre mot de passe."));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(frenchError(error.message)));
  }

  redirect("/app");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isEmail(email)) {
    redirect("/signup?error=" + encodeURIComponent("Cette adresse e-mail n'est pas valide."));
  }
  if (password.length < 8) {
    redirect("/signup?error=" + encodeURIComponent("Le mot de passe doit contenir au moins 8 caractères."));
  }

  const origin =
    headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(frenchError(error.message)));
  }

  // Si la confirmation par e-mail est activée, aucune session n'existe encore.
  if (!data.session) {
    redirect(
      "/login?message=" +
        encodeURIComponent(
          "Compte créé. Ouvrez l'e-mail de confirmation que nous venons de vous envoyer, puis connectez-vous.",
        ),
    );
  }

  redirect("/app");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
