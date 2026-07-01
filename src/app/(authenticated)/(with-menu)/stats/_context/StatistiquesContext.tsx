import { ReactNode } from "react";

import { StatistiquesApiType } from "@/schemas/api/statistique.schema";

import { StatistiquesClientProvider } from "./StatistiquesClientContext";

export type StatistiquesContextType = {
  statistiques: StatistiquesApiType;
};

export function StatistiquesProvider({
  children,
  statistiques,
}: {
  children: ReactNode;
  statistiques: StatistiquesApiType | null;
}) {
  return (
    <StatistiquesClientProvider statistiques={statistiques}>
      {children}
    </StatistiquesClientProvider>
  );
}
