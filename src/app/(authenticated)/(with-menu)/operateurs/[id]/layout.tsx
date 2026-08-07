import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { getOperateur } from "@/app/api/operateurs/operateur.service";
import { createOperateurEvent } from "@/app/api/user-action/user-action.service";
import { OperateurProvider } from "@/contexts/OperateurContext";

import { OperateurHeader } from "./_components/OperateurHeader";

export default async function OperateurLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operateurId = Number(id);

  if (!Number.isInteger(operateurId)) {
    notFound();
  }

  const operateur = await getOperateur(operateurId);

  if (!operateur) {
    notFound();
  }

  await createOperateurEvent("GET", operateur.id);

  return (
    <OperateurProvider entity={operateur}>
      <div className="flex flex-col h-full gap-3 pb-4">
        <OperateurHeader />
        <div className="flex flex-col gap-3 max-w-7xl mx-auto px-3">
          {children}
        </div>
      </div>
    </OperateurProvider>
  );
}
