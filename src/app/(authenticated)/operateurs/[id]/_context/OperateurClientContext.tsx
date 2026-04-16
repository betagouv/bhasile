"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { OperateurApiRead } from "@/schemas/api/operateur.schema";

import { OperateurContextType } from "./OperateurContext";

type OperateurContextInternalType = {
  operateur: OperateurApiRead | null;
  setOperateur: (operateur: OperateurApiRead | null) => void;
};

const OperateurContextInternal = createContext<OperateurContextInternalType>({
  operateur: null,
  setOperateur: () => {},
});

export function OperateurClientProvider({
  children,
  operateur: initialOperateur,
}: {
  children: ReactNode;
  operateur: OperateurApiRead | null;
}) {
  const [operateur, setOperateur] = useState(initialOperateur);

  return (
    <OperateurContextInternal.Provider value={{ operateur, setOperateur }}>
      {children}
    </OperateurContextInternal.Provider>
  );
}

export function useOperateurContext(): OperateurContextType & {
  setOperateur: (operateur: OperateurApiRead | null) => void;
} {
  const context = useContext(OperateurContextInternal);

  if (context === undefined) {
    throw new Error(
      "useOperateurContext doit être utilisé à l'intérieur d'un OperateurProvider"
    );
  }

  if (context.operateur === null) {
    throw new Error("Opérateur indisponible dans le contexte");
  }
  return {
    operateur: context.operateur,
    setOperateur: context.setOperateur,
  };
}
