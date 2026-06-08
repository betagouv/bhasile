"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { StatistiquesApiType } from "@/schemas/api/statistiques.schema";

import { StatistiquesContextType } from "./StatistiquesContext";

type StatistiquesContextInternalType = {
  statistiques: StatistiquesApiType | null;
  setStatistiques: (statistiques: StatistiquesApiType | null) => void;
};

const StatistiquesContextInternal =
  createContext<StatistiquesContextInternalType>({
    statistiques: null,
    setStatistiques: () => {},
  });

export function StatistiquesClientProvider({
  children,
  statistiques: initialStatistiques,
}: {
  children: ReactNode;
  statistiques: StatistiquesApiType | null;
}) {
  const [statistiques, setStatistiques] = useState(initialStatistiques);

  return (
    <StatistiquesContextInternal.Provider
      value={{ statistiques: statistiques, setStatistiques: setStatistiques }}
    >
      {children}
    </StatistiquesContextInternal.Provider>
  );
}

export function useStatistiquesContext(): StatistiquesContextType & {
  setStatistiques: (statistiques: StatistiquesApiType | null) => void;
} {
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
    setStatistiques: context.setStatistiques,
  };
}
