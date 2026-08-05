"use client";

import { createContext, ReactNode, useContext } from "react";

import { StatistiquesCartographieContextType } from "@/contexts/StatistiquesCartographieContext";
import { CartographieApiRead } from "@/schemas/api/statistique-cartographie.schema";

type StatistiquesCartographieContextInternalType = {
  statistiques: CartographieApiRead | null;
};

const StatistiquesCartographieContextInternal =
  createContext<StatistiquesCartographieContextInternalType>({
    statistiques: null,
  });

export function StatistiquesCartographieClientProvider({
  children,
  statistiques: initialStatistiques,
}: {
  children: ReactNode;
  statistiques: CartographieApiRead | null;
}) {
  return (
    <StatistiquesCartographieContextInternal.Provider
      value={{ statistiques: initialStatistiques }}
    >
      {children}
    </StatistiquesCartographieContextInternal.Provider>
  );
}

export function useStatistiquesCartographieContext(): StatistiquesCartographieContextType {
  const context = useContext(StatistiquesCartographieContextInternal);

  if (context.statistiques === null) {
    throw new Error(
      "Statistiques de cartographie indisponibles dans le contexte"
    );
  }
  return {
    statistiques: context.statistiques,
  };
}
