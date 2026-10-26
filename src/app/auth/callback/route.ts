import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Page appelée par le lien de confirmation reçu par e-mail.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/app`);
    }
  }

  const message = encodeURIComponent(
    "Le lien de confirmation est invalide ou expiré. Connectez-vous, ou créez de nouveau votre compte.",
  );
  return NextResponse.redirect(`${origin}/login?error=${message}`);
}
