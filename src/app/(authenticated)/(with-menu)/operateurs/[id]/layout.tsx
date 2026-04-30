import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { OperateurApiRead } from "@/schemas/api/operateur.schema";

import { OperateurHeader } from "./_components/OperateurHeader";
import { OperateurProvider } from "./_context/OperateurContext";

async function getOperateur(id: string): Promise<OperateurApiRead> {
  try {
    const baseUrl = process.env.NEXT_URL || "";
    const result = await fetch(`${baseUrl}/api/operateurs/${id}`, {
      cache: "no-store",
      // Requête côté serveur donc il faut appeler les headers manuellement
      headers: await headers(),
    });

    if (!result.ok) {
      throw new Error(`Impossible de récupérer l'opérateur : ${result.status}`);
    }

    return await result.json();
  } catch (error) {
    console.error(error);
    notFound();
  }
}

export default async function OperateurLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operateur = await getOperateur(id);

  if (!operateur) {
    notFound();
  }

  return (
    <OperateurProvider operateur={operateur}>
      <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
        <OperateurHeader />
        <div className="flex flex-col gap-3 px-3">{children}</div>
      </div>
    </OperateurProvider>
  );
}
