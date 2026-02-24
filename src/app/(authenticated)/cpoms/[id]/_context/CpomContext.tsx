import { ReactNode } from "react";

import { CpomApiType } from "@/schemas/api/cpom.schema";

import { CpomClientProvider } from "./CpomClientContext";

export type CpomContextType = {
  cpom: CpomApiType;
};

export function CpomProvider({
  children,
  cpom,
}: {
  children: ReactNode;
  cpom: CpomApiType | null;
}) {
  return <CpomClientProvider cpom={cpom}>{children}</CpomClientProvider>;
}
