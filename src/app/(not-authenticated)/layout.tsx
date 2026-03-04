import type { Metadata } from "next";

import { Footer } from "@/app/components/common/Footer";
import { Header } from "@/app/components/common/Header";

export const metadata: Metadata = {
  title: "Bhasile - Connexion",
  description: "Piloter le parc de logements pour demandeurs d’asile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen flex flex-col w-full" id="content">
      <Header />
      <div className="fr-container mx-auto my-10">{children}</div>
      <Footer />
    </main>
  );
}
