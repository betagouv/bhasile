import { ReactNode } from "react";

import { StructureApiRead } from "@/schemas/api/structure.schema";

import { StructureClientProvider } from "./StructureClientContext";

export type StructureContextType = {
  structure: StructureApiRead;
};

export function StructureProvider({
  children,
  structure: backendStructure,
}: {
  children: ReactNode;
  structure: StructureApiRead | null;
}) {
  const structure = backendStructure
    ? ({
        ...backendStructure,
        coordinates: [
          Number(backendStructure.latitude),
          Number(backendStructure.longitude),
        ],
      } as unknown as StructureApiRead)
    : null;

  return (
    <StructureClientProvider structure={structure}>
      {children}
    </StructureClientProvider>
  );
}
