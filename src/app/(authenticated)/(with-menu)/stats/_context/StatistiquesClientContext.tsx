"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { StatistiquesApiType } from "@/schemas/api/statistiques.schema";

import { StatistiquesContextType } from "./StatistiquesContext";

type StatistiquesContextInternalType = {
  statistiques: StatistiquesApiType | null;
};

const StatistiquesContextInternal =
  createContext<StatistiquesContextInternalType>({
    statistiques: null,
  });

export function StatistiquesClientProvider({
  children,
  statistiques: initialStatistiques,
}: {
  children: ReactNode;
  statistiques: StatistiquesApiType | null;
}) {
  const [statistiques] = useState(initialStatistiques);

  return (
    <StatistiquesContextInternal.Provider value={{ statistiques }}>
      {children}
    </StatistiquesContextInternal.Provider>
  );
}

export function useStatistiquesContext(): StatistiquesContextType {
  const context = useContext(StatistiquesContextInternal);

  if (context === undefined) {
    throw new Error(
      "useStatistiquesContext doit être utilisé à l'intérieur d'un StatistiquesProvider"
    );
  }

  if (context.statistiques === null) {
    throw new Error("Statistiques indisponibles dans le contexte");
  }
  return {
    statistiques: context.statistiques,
  };
}
