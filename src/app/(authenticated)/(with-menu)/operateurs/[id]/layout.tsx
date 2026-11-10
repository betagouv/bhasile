import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReactNode } from "react";

import { getOperateur } from "@/app/api/operateurs/operateur.service";
import { createReadEvent } from "@/app/api/user-actions/user-action.service";
import { parseId } from "@/app/utils/string.util";
import { OperateurProvider } from "@/contexts/OperateurContext";
import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

import { OperateurHeader } from "./_components/OperateurHeader";

export default async function OperateurLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operateurId = parseId(id);

  if (operateurId === null) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const operateur = await getOperateur(
    operateurId,
    session?.user as SessionUser | undefined
  );

  if (!operateur) {
    notFound();
  }

  await createReadEvent({ operateurId: operateur.id });

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
