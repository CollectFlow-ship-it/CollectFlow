import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

// Police des titres et du logo. Le texte courant garde la police système.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CollectFlow : relance automatique des factures impayées",
    template: "%s | CollectFlow",
  },
  description:
    "Relance automatisée des factures impayées par e-mail, pour les TPE, PME et indépendants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={display.variable}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
