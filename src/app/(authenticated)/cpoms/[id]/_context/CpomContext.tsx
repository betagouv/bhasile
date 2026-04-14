import { ReactNode } from "react";

import { CpomViewType } from "@/types/cpom.type";

import { CpomClientProvider } from "./CpomClientContext";

export type CpomContextType = {
  cpom: CpomViewType;
};

export function CpomProvider({
  children,
  cpom,
}: {
  children: ReactNode;
  cpom: CpomViewType | null;
}) {
  return <CpomClientProvider cpom={cpom}>{children}</CpomClientProvider>;
}
