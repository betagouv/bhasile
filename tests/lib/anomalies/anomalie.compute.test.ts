import {
  acteContext,
  budgetContext,
  structureContext,
  TEST_CURRENT_YEAR,
} from "tests/test-utils/factories/anomalie-context.factory";
import { describe, expect, it } from "vitest";

import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";
import { ANOMALIE_RULES } from "@/lib/anomalies/rules";
import { AnomalieCode } from "@/types/anomalie.type";

const options = { currentYear: TEST_CURRENT_YEAR };

describe("computeAnomalies", () => {
  it("implémente exactement une règle par code du registre", () => {
    expect(ANOMALIE_RULES.map((rule) => rule.code).sort()).toEqual(
      [...AnomalieCode].sort()
    );
  });

  it("n'évalue aucune règle quand le contexte est vide", () => {
    const { detected, evaluatedCodes } = computeAnomalies({}, options);

    expect(detected).toEqual([]);
    expect(evaluatedCodes).toEqual([]);
  });

  it("n'évalue pas une règle dont une tranche requise est absente", () => {
    const { evaluatedCodes } = computeAnomalies(
      { structure: structureContext() },
      options
    );

    expect(evaluatedCodes).not.toContain("RESULTAT_NET_EQ_0");
  });

  it("évalue une règle dont toutes les tranches requises sont fournies, même vides", () => {
    const { evaluatedCodes } = computeAnomalies(
      { structure: structureContext(), budgets: [] },
      options
    );

    expect(evaluatedCodes).toContain("RESULTAT_NET_EQ_0");
  });

  it("distingue une règle évaluée sans détection d'une règle non évaluée", () => {
    const context = {
      structure: structureContext(),
      budgets: [budgetContext({ totalProduits: 1_000, totalCharges: 900 })],
    };

    const { detected, evaluatedCodes } = computeAnomalies(context, options);

    expect(evaluatedCodes).toContain("RESULTAT_NET_EQ_0");
    expect(detected.map((detectee) => detectee.code)).not.toContain(
      "RESULTAT_NET_EQ_0"
    );
  });

  it("remonte une détection par entité fautive", () => {
    const { detected } = computeAnomalies(
      {
        structure: structureContext(),
        actes: [
          acteContext({
            id: 10,
            startDate: new Date("2015-01-01"),
            endDate: new Date("2019-01-01"),
          }),
          acteContext({
            id: 11,
            startDate: new Date("2019-01-01"),
            endDate: new Date("2026-01-01"),
          }),
        ],
      },
      options
    );

    expect(
      detected
        .filter(
          (detectee) => detectee.code === "CONVENTION_AUTORISEE_DUREE_NOT_5Y"
        )
        .map((detectee) => detectee.targetId)
        .sort()
    ).toEqual([10, 11]);
  });
});
