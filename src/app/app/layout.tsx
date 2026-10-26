import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <span className="font-extrabold tracking-tight text-brand">CollectFlow</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted sm:inline">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-line px-3 py-1.5 font-semibold hover:bg-brand-soft"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
