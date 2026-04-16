import { ReactNode } from "react";

import { OperateurApiRead } from "@/schemas/api/operateur.schema";

import { OperateurClientProvider } from "./OperateurClientContext";

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
