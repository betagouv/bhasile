import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReactNode } from "react";

import { getActualisationYear } from "@/app/api/structures/actualisation.util";
import { getFullStructure } from "@/app/api/structures/structure.service";
import { createReadEvent } from "@/app/api/user-actions/user-action.service";
import { parseId } from "@/app/utils/string.util";
import { StructureProvider } from "@/contexts/StructureContext";
import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

import { StructureHeader } from "./_components/_header/StructureHeader";

export default async function StructureLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const structureId = parseId(id);
  if (structureId === null) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const structure = await getFullStructure(
    structureId,
    session?.user as SessionUser | undefined
  );
  if (!structure) {
    notFound();
  }
  await createReadEvent({ structureId: structure.id });

  const actualisationYear = getActualisationYear();

  const plainStructure = JSON.parse(JSON.stringify(structure));

  return (
    <StructureProvider entity={plainStructure}>
      <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
        <StructureHeader actualisationYear={actualisationYear} />
        <div className="flex flex-col gap-3 max-w-7xl mx-auto px-3">
          {children}
        </div>
      </div>
    </StructureProvider>
  );
}
