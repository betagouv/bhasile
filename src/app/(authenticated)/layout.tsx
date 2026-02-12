import type { Metadata } from "next";

import { Menu } from "../components/Menu";

export const metadata: Metadata = {
  title: "Bhasile",
  description: "Piloter le parc de logements pour demandeurs d’asile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="w-full max-w-screen flex bg-white" id="content">
      <Menu />
      <div className="flex-1">{children}</div>
    </main>
  );
}
