"use client";

import { ReactNode } from "react";

import { CartographieApiRead } from "@/schemas/api/statistique-cartographie.schema";

import { StatistiquesCartographieClientProvider } from "./StatistiquesCartographieClientContext";

export type StatistiquesCartographieContextType = {
  statistiques: CartographieApiRead;
};

export function StatistiquesCartographieProvider({
  children,
  statistiques,
}: {
  children: ReactNode;
  statistiques: CartographieApiRead | null;
}) {
  return (
    <StatistiquesCartographieClientProvider statistiques={statistiques}>
      {children}
    </StatistiquesCartographieClientProvider>
  );
}
