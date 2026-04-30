"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { StructureApiRead } from "@/schemas/api/structure.schema";

import { StructureContextType } from "./StructureContext";

type StructureContextInternalType = {
  structure: StructureApiRead | null;
  setStructure: (s: StructureApiRead | null) => void;
};

const StructureContextInternal = createContext<StructureContextInternalType>({
  structure: null,
  setStructure: () => {},
});

export function StructureClientProvider({
  children,
  structure: initialStructure,
}: {
  children: ReactNode;
  structure: StructureApiRead | null;
}) {
  const [structure, setStructure] = useState(initialStructure);

  return (
    <StructureContextInternal.Provider value={{ structure, setStructure }}>
      {children}
    </StructureContextInternal.Provider>
  );
}

export function useStructureContext(): StructureContextType & {
  setStructure: (s: StructureApiRead | null) => void;
} {
  const context = useContext(StructureContextInternal);

  if (context === undefined) {
    throw new Error(
      "useStructureContext must be used within a StructureProvider"
    );
  }

  if (context.structure === null) {
    throw new Error("Structure is not available");
  }
  return {
    structure: context.structure,
    setStructure: context.setStructure,
  };
}
