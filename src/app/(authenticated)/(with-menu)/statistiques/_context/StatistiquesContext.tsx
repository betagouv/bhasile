"use client";

import { ReactNode } from "react";

import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesClientProvider } from "./StatistiquesClientContext";

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
