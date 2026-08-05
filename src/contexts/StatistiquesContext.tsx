"use client";

import { ReactNode } from "react";

import { StatistiquesClientProvider } from "@/contexts/StatistiquesClientContext";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

export type StatistiquesContextType = {
  statistiques: StatistiqueApiRead;
};

export function StatistiquesProvider({
  children,
  statistiques,
}: {
  children: ReactNode;
  statistiques: StatistiqueApiRead | null;
}) {
  return (
    <StatistiquesClientProvider statistiques={statistiques}>
      {children}
    </StatistiquesClientProvider>
  );
}
