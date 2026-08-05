import { ReactNode } from "react";

import { CpomClientProvider } from "@/contexts/CpomClientContext";
import { CpomApiRead } from "@/schemas/api/cpom.schema";

export type CpomContextType = {
  cpom: CpomApiRead;
};

export function CpomProvider({
  children,
  cpom,
}: {
  children: ReactNode;
  cpom: CpomApiRead | null;
}) {
  return <CpomClientProvider cpom={cpom}>{children}</CpomClientProvider>;
}
