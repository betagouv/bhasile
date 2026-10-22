import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FinanceCards } from "@/app/(authenticated)/(with-menu)/statistiques/_components/finances/FinanceCards";
import { StatistiquesProvider } from "@/contexts/StatistiquesContext";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

describe("FinanceCards", () => {
  it("indique l'absence de données quand aucune année financière n'est disponible", () => {
    const statistiques = {
      finance: { byYear: [] },
    } as unknown as StatistiqueApiRead;

    render(
      <StatistiquesProvider entity={statistiques}>
        <FinanceCards />
      </StatistiquesProvider>
    );

    expect(
      screen.getByText("Aucune donnée financière disponible.")
    ).toBeInTheDocument();
  });
});
