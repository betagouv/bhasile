import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { StructureApiRead } from "@/schemas/api/structure.schema";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  try {
    const result = await fetch(
      `${process.env.NEXT_URL}/api/structures/${id}`,
      // Requête côté serveur donc il faut appeler les headers manuellement
      { next: { revalidate: 0 }, headers: await headers() }
    );

    if (!result.ok) {
      console.error(`API error: ${result.status}`, await result.text());
      return children;
    }

    const structure: StructureApiRead | null = await result.json();
    if (structure?.forms && structure?.forms?.length > 0) {
      redirect(
        `/ajout-structure/existe-deja?codeBhasile=${structure.codeBhasile}`
      );
    }

    return children;
  } catch (error) {
    console.error("Error checking for existing structure:", error);
    throw error;
  }
}
