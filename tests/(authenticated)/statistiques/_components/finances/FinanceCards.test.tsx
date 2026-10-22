import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FinanceCards } from "@/app/(authenticated)/(with-menu)/statistiques/_components/finances/FinanceCards";
import { StatistiquesProvider } from "@/contexts/StatistiquesContext";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

describe("FinanceCards", () => {
  it("n'affiche rien quand l'année en cours n'a pas de données financières", () => {
    const statistiques = {
      finance: { byYear: [] },
    } as unknown as StatistiqueApiRead;

    const { container } = render(
      <StatistiquesProvider entity={statistiques}>
        <FinanceCards />
      </StatistiquesProvider>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
