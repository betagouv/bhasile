import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bhasile",
  description: "Piloter le parc de logements pour demandeurs d’asile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
