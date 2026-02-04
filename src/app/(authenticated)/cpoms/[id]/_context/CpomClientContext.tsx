"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { CpomApiType } from "@/schemas/api/cpom.schema";

import { CpomContextType } from "./CpomContext";

type CpomContextInternalType = {
  cpom: CpomApiType | null;
  setCpom: (c: CpomApiType | null) => void;
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
  cpom: CpomApiType | null;
}) {
  const [cpom, setCpom] = useState(initialCpom);

  return (
    <CpomContextInternal.Provider value={{ cpom, setCpom }}>
      {children}
    </CpomContextInternal.Provider>
  );
}

export function useCpomContext(): CpomContextType & {
  setCpom: (c: CpomApiType | null) => void;
} {
  const context = useContext(CpomContextInternal);

  if (context === undefined) {
    throw new Error(
      "useStructureContext must be used within a StructureProvider"
    );
  }

  if (context.cpom === null) {
    throw new Error("Cpom is not available");
  }
  return {
    cpom: context.cpom,
    setCpom: context.setCpom,
  };
}
