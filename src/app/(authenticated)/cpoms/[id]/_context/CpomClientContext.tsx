"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { CpomViewType } from "@/types/cpom.type";

import { CpomContextType } from "./CpomContext";

type CpomContextInternalType = {
  cpom: CpomViewType | null;
  setCpom: (c: CpomViewType | null) => void;
};

const CpomContextInternal = createContext<CpomContextInternalType>({
  cpom: null,
  setCpom: () => {},
});

export function CpomClientProvider({
  children,
  cpom: initialCpom,
}: {
  children: ReactNode;
  cpom: CpomViewType | null;
}) {
  const [cpom, setCpom] = useState(initialCpom);

  return (
    <CpomContextInternal.Provider value={{ cpom, setCpom }}>
      {children}
    </CpomContextInternal.Provider>
  );
}

export function useCpomContext(): CpomContextType & {
  setCpom: (c: CpomViewType | null) => void;
} {
  const context = useContext(CpomContextInternal);

  if (context === undefined) {
    throw new Error("useCpomContext must be used within a CpomProvider");
  }

  if (context.cpom === null) {
    throw new Error("Cpom is not available");
  }
  return {
    cpom: context.cpom,
    setCpom: context.setCpom,
  };
}
