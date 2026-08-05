"use client";

import { createContext, ReactNode, useContext } from "react";

import { StatistiquesContextType } from "@/contexts/StatistiquesContext";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

type StatistiquesContextInternalType = {
  statistiques: StatistiqueApiRead | null;
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
  statistiques: StatistiqueApiRead | null;
}) {
  return (
    <StatistiquesContextInternal.Provider
      value={{ statistiques: initialStatistiques }}
    >
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
