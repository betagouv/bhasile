import { detectionsOf } from "tests/test-utils/anomalie";
import { describe, expect, it } from "vitest";

import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";

describe("ADRESSE_NON_LOCALISEE", () => {
  it("signale la structure dès qu'une adresse n'est pas localisée", () => {
    expect(
      detectionsOf("ADRESSE_NON_LOCALISEE", {
        adressesNonLocalisees: 2,
      })
    ).toEqual([{ year: 0, targetId: 0 }]);
  });

  it("ne signale rien quand toutes les adresses sont localisées", () => {
    expect(
      detectionsOf("ADRESSE_NON_LOCALISEE", {
        adressesNonLocalisees: 0,
      })
    ).toEqual([]);
  });

  it("n'évalue pas la règle quand la tranche serveur est absente, comme dans le formulaire", () => {
    const { evaluatedCodes } = computeAnomalies(
      { adresses: [] },
      { currentYear: 2026 }
    );

    expect(evaluatedCodes).not.toContain("ADRESSE_NON_LOCALISEE");
  });
});
