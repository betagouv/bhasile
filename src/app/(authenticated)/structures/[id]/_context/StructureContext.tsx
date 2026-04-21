import { ReactNode } from "react";

import { StructureApiRead } from "@/schemas/api/structure.schema";

import { StructureClientProvider } from "./StructureClientContext";

export type StructureContextType = {
  structure: StructureApiRead;
};

export function StructureProvider({
  children,
  structure,
}: {
  children: ReactNode;
  structure: StructureApiRead | null;
}) {
  return (
    <StructureClientProvider structure={structure}>
      {children}
    </StructureClientProvider>
  );
}
