import { ReactNode } from "react";

import { CpomApiRead } from "@/schemas/api/cpom.schema";

import { CpomClientProvider } from "./CpomClientContext";

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
