import { ReactNode } from "react";

import { OperateurClientProvider } from "@/contexts/OperateurClientContext";
import { OperateurApiRead } from "@/schemas/api/operateur.schema";

export type OperateurContextType = {
  operateur: OperateurApiRead;
};

export function OperateurProvider({
  children,
  operateur,
}: {
  children: ReactNode;
  operateur: OperateurApiRead | null;
}) {
  return (
    <OperateurClientProvider operateur={operateur}>
      {children}
    </OperateurClientProvider>
  );
}
