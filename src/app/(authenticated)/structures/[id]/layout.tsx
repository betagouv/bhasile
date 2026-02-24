import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { StructureApiType } from "@/schemas/api/structure.schema";

import { StructureHeader } from "./_components/_header/StructureHeader";
import { AutoSaveErrorToast } from "./_components/AutoSaveErrorToast";
import { StructureProvider } from "./_context/StructureContext";

async function getStructure(id: string): Promise<StructureApiType> {
  try {
    const baseUrl = process.env.NEXT_URL || "";
    const result = await fetch(`${baseUrl}/api/structures/${id}`, {
      cache: "no-store",
      // Requête côté serveur donc il faut appeler les headers manuellement
      headers: await headers(),
    });

    if (!result.ok) {
      throw new Error(
        `Impossible de récupérer la structure : ${result.status}`
      );
    }

    return await result.json();
  } catch (error) {
    console.error(error);
    notFound();
  }
}

export default async function StructureLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const structure = await getStructure(id);

  if (!structure) {
    notFound();
  }

  return (
    <StructureProvider structure={structure}>
      <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
        <StructureHeader />
        {children}
        <AutoSaveErrorToast />
      </div>
    </StructureProvider>
  );
}
