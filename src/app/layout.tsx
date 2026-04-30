import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SECUREXIA — ERP Sécurité 360°",
  description: "Plateforme de pilotage de conformité ERP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-muted-light">{children}</body>
    </html>
  );
}
