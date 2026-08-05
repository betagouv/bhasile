import { ReactNode } from "react";

import { StructureClientProvider } from "@/contexts/StructureClientContext";
import { StructureApiRead } from "@/schemas/api/structure.schema";

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
