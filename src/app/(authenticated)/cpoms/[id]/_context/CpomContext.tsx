import { ReactNode } from "react";

import { Cpom } from "@/types/cpom.type";

import { CpomClientProvider } from "./CpomClientContext";

export type CpomContextType = {
  cpom: Cpom;
};

export function CpomProvider({
  children,
  cpom,
}: {
  children: ReactNode;
  cpom: Cpom | null;
}) {
  return <CpomClientProvider cpom={cpom}>{children}</CpomClientProvider>;
}
