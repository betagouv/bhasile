import { notFound } from "next/navigation";

import { getCpomById } from "@/app/api/cpoms/cpom.service";
import { createReadEvent } from "@/app/api/user-actions/user-action.service";
import { parseId } from "@/app/utils/string.util";
import { CpomProvider } from "@/contexts/CpomContext";

import { CpomHeader } from "./_components/CpomHeader";

export default async function CpomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cpomId = parseId(id);
  if (cpomId === null) {
    notFound();
  }

  const cpom = await getCpomById(cpomId);
  if (!cpom) {
    notFound();
  }
  await createReadEvent({ cpomId: cpom.id });

  return (
    <CpomProvider entity={cpom}>
      <div className="flex flex-col h-full gap-3 pb-4">
        <CpomHeader />
        <div className="flex flex-col gap-3 w-full max-w-7xl mx-auto px-3">
          {children}
        </div>
      </div>
    </CpomProvider>
  );
}
