"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { CpomApiRead } from "@/schemas/api/cpom.schema";

import { CpomContextType } from "./CpomContext";

type CpomContextInternalType = {
  cpom: CpomApiRead | null;
  setCpom: (c: CpomApiRead | null) => void;
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
  cpom: CpomApiRead | null;
}) {
  const [cpom, setCpom] = useState(initialCpom);

  return (
    <CpomContextInternal.Provider value={{ cpom, setCpom }}>
      {children}
    </CpomContextInternal.Provider>
  );
}

export function useCpomContext(): CpomContextType & {
  setCpom: (c: CpomApiRead | null) => void;
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
