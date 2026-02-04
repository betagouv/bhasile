import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CpomApiType } from "@/schemas/api/cpom.schema";

import { CpomModificationHeader } from "./_components/CpomModificationHeader";
import { CpomProvider } from "./_context/CpomContext";

async function getCpom(id: string): Promise<CpomApiType> {
  try {
    // Use NEXT_URL instead of NEXT_PUBLIC_BASE_URL
    const baseUrl = process.env.NEXT_URL || "";
    const result = await fetch(`${baseUrl}/api/cpoms/${id}`, {
      cache: "no-store",
      // Requête côté serveur donc il faut appeler les headers manuellement
      headers: await headers(),
    });

    if (!result.ok) {
      throw new Error(`Impossible de récupérer le cpom : ${result.status}`);
    }

    return await result.json();
  } catch (error) {
    console.error(error);
    notFound();
  }
}

export default async function CpomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cpom = await getCpom(id);

  if (!cpom) {
    notFound();
  }

  return (
    <CpomProvider cpom={cpom}>
      <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
        <CpomModificationHeader />
        <div className="mx-4">{children}</div>;
      </div>
    </CpomProvider>
  );
}
