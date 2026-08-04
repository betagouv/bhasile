import {
  acteContexte,
  ANNEE_COURANTE_TEST,
  budgetContexte,
  structureContexte,
} from "tests/test-utils/factories/anomalie-contexte.factory";
import { describe, expect, it } from "vitest";

import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";
import { REGLES_ANOMALIES } from "@/lib/anomalies/regles";
import { AnomalieCode } from "@/types/anomalie.type";

const options = { anneeCourante: ANNEE_COURANTE_TEST };

describe("computeAnomalies", () => {
  it("implémente exactement une règle par code du registre", () => {
    expect(REGLES_ANOMALIES.map((regle) => regle.code).sort()).toEqual(
      [...AnomalieCode].sort()
    );
  });

  it("n'évalue aucune règle quand le contexte est vide", () => {
    const { detectees, codesEvalues } = computeAnomalies({}, options);

    expect(detectees).toEqual([]);
    expect(codesEvalues).toEqual([]);
  });

  it("n'évalue pas une règle dont une tranche requise est absente", () => {
    const { codesEvalues } = computeAnomalies(
      { structure: structureContexte() },
      options
    );

    expect(codesEvalues).not.toContain("RESULTAT_NET_EQ_0");
  });

  it("évalue une règle dont toutes les tranches requises sont fournies, même vides", () => {
    const { codesEvalues } = computeAnomalies(
      { structure: structureContexte(), budgets: [] },
      options
    );

    expect(codesEvalues).toContain("RESULTAT_NET_EQ_0");
  });

  it("distingue une règle évaluée sans détection d'une règle non évaluée", () => {
    const contexte = {
      structure: structureContexte(),
      budgets: [budgetContexte({ totalProduits: 1_000, totalCharges: 900 })],
    };

    const { detectees, codesEvalues } = computeAnomalies(contexte, options);

    expect(codesEvalues).toContain("RESULTAT_NET_EQ_0");
    expect(detectees.map((detectee) => detectee.code)).not.toContain(
      "RESULTAT_NET_EQ_0"
    );
  });

  it("remonte une détection par entité fautive", () => {
    const { detectees } = computeAnomalies(
      {
        structure: structureContexte(),
        actes: [
          acteContexte({
            id: 10,
            startDate: new Date("2015-01-01"),
            endDate: new Date("2019-01-01"),
          }),
          acteContexte({
            id: 11,
            startDate: new Date("2019-01-01"),
            endDate: new Date("2026-01-01"),
          }),
        ],
      },
      options
    );

    expect(
      detectees
        .filter(
          (detectee) => detectee.code === "CONVENTION_AUTORISEE_DUREE_NOT_5Y"
        )
        .map((detectee) => detectee.targetId)
        .sort()
    ).toEqual([10, 11]);
  });
});
