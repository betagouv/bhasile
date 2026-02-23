import { ReactNode } from "react";

import { Structure } from "@/types/structure.type";

import { StructureClientProvider } from "./StructureClientContext";

export type StructureContextType = {
  structure: Structure;
};

export function StructureProvider({
  children,
  structure: backendStructure,
}: {
  children: ReactNode;
  structure: Structure | null;
}) {
  const structure = backendStructure
    ? ({
        ...backendStructure,
        coordinates: [
          Number(backendStructure.latitude),
          Number(backendStructure.longitude),
        ],
      } as unknown as Structure)
    : null;

  return (
    <StructureClientProvider structure={structure}>
      {children}
    </StructureClientProvider>
  );
}
