import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollectFlow",
  description:
    "Relance automatisée des factures impayées par e-mail, pour les TPE, PME et indépendants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
