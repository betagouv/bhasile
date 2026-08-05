import { ReactNode } from "react";

import { StatistiquesCartographieClientProvider } from "@/contexts/StatistiquesCartographieClientContext";
import { CartographieApiRead } from "@/schemas/api/statistique-cartographie.schema";

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
