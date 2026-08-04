import { detectionsDe } from "tests/test-utils/anomalie";
import {
  budgetContexte,
  indicateurContexte,
  structureContexte,
} from "tests/test-utils/factories/anomalie-contexte.factory";
import { describe, expect, it } from "vitest";

import { StructureType } from "@/types/structure.type";

describe("fenêtre des exercices", () => {
  it("ignore l'exercice courant, non clos", () => {
    const detections = detectionsDe("RESULTAT_NET_EQ_0", {
      structure: structureContexte(),
      budgets: [
        budgetContexte({ year: 2026, totalProduits: 500, totalCharges: 500 }),
      ],
    });

    expect(detections).toEqual([]);
  });

  it("ignore les exercices antérieurs à l'ouverture de la structure", () => {
    const detections = detectionsDe("RESULTAT_NET_EQ_0", {
      structure: structureContexte({ creationDate: new Date("2020-01-01") }),
      budgets: [
        budgetContexte({ year: 2018, totalProduits: 500, totalCharges: 500 }),
      ],
    });

    expect(detections).toEqual([]);
  });

  it("ignore un budget marqué manquant", () => {
    const detections = detectionsDe("RESULTAT_NET_EQ_0", {
      structure: structureContexte(),
      budgets: [
        budgetContexte({
          isMissing: true,
          totalProduits: 500,
          totalCharges: 500,
        }),
      ],
    });

    expect(detections).toEqual([]);
  });
});

describe("RESULTAT_NET_EQ_0", () => {
  it("signale chaque exercice dont le résultat net est nul", () => {
    const detections = detectionsDe("RESULTAT_NET_EQ_0", {
      structure: structureContexte(),
      budgets: [
        budgetContexte({ year: 2023, totalProduits: 500, totalCharges: 500 }),
        budgetContexte({ year: 2024, totalProduits: 500, totalCharges: 400 }),
        budgetContexte({ year: 2025, totalProduits: 700, totalCharges: 700 }),
      ],
    });

    expect(detections).toEqual([
      { year: 2023, targetId: 0 },
      { year: 2025, targetId: 0 },
    ]);
  });

  it("ne signale rien quand produits et charges sont tous deux absents", () => {
    const detections = detectionsDe("RESULTAT_NET_EQ_0", {
      structure: structureContexte(),
      budgets: [budgetContexte({ totalProduits: null, totalCharges: null })],
    });

    expect(detections).toEqual([]);
  });
});

describe("affectations des structures autorisées", () => {
  it("signale une affectation globale sans détail", () => {
    const detections = detectionsDe("AFFECTATION_DETAIL_MANQUANT", {
      structure: structureContexte(),
      budgets: [budgetContexte({ affectationReservesFondsDedies: 1_000 })],
    });

    expect(detections).toEqual([{ year: 2024, targetId: 0 }]);
  });

  it("signale un détail dont la somme diffère de l'affectation globale", () => {
    const detections = detectionsDe("AFFECTATION_DETAIL_ECART", {
      structure: structureContexte(),
      budgets: [
        budgetContexte({
          affectationReservesFondsDedies: 1_000,
          reserveInvestissement: 400,
          reportANouveau: 300,
        }),
      ],
    });

    expect(detections).toEqual([{ year: 2024, targetId: 0 }]);
  });

  it("accepte un détail dont la somme correspond à l'affectation globale", () => {
    const detections = detectionsDe("AFFECTATION_DETAIL_ECART", {
      structure: structureContexte(),
      budgets: [
        budgetContexte({
          affectationReservesFondsDedies: 1_000,
          reserveInvestissement: 700,
          reportANouveau: 300,
        }),
      ],
    });

    expect(detections).toEqual([]);
  });

  it("signale un écart entre le résultat net et la somme reprise État + affectation", () => {
    const detections = detectionsDe("REPRISE_PLUS_AFFECTATION_ECART", {
      structure: structureContexte(),
      budgets: [
        budgetContexte({
          totalProduits: 1_000,
          totalCharges: 900,
          repriseEtat: 0,
          affectationReservesFondsDedies: 50,
        }),
      ],
    });

    expect(detections).toEqual([{ year: 2024, targetId: 0 }]);
  });

  it("ne s'applique pas à une structure subventionnée", () => {
    const detections = detectionsDe("AFFECTATION_DETAIL_MANQUANT", {
      structure: structureContexte({ type: StructureType.HUDA }),
      budgets: [budgetContexte({ affectationReservesFondsDedies: 1_000 })],
    });

    expect(detections).toEqual([]);
  });
});

describe("SUBVENTIONNEE_DEFICIT_AVEC_EXCEDENT", () => {
  it("signale une structure déficitaire avec un excédent renseigné", () => {
    const detections = detectionsDe("SUBVENTIONNEE_DEFICIT_AVEC_EXCEDENT", {
      structure: structureContexte({ type: StructureType.HUDA }),
      budgets: [
        budgetContexte({
          totalProduits: 800,
          totalCharges: 1_000,
          excedentRecupere: 50,
        }),
      ],
    });

    expect(detections).toEqual([{ year: 2024, targetId: 0 }]);
  });
});

describe("TAUX_ENCADREMENT_LT_2", () => {
  it("signale chaque exercice dont le taux d'encadrement est inférieur à 2", () => {
    const detections = detectionsDe("TAUX_ENCADREMENT_LT_2", {
      structure: structureContexte(),
      indicateurs: [
        indicateurContexte({ year: 2023, tauxEncadrement: 0 }),
        indicateurContexte({ year: 2024, tauxEncadrement: 12 }),
      ],
    });

    expect(detections).toEqual([{ year: 2023, targetId: 0 }]);
  });

  it("retient le réalisé plutôt que le prévisionnel pour un même exercice", () => {
    const detections = detectionsDe("TAUX_ENCADREMENT_LT_2", {
      structure: structureContexte(),
      indicateurs: [
        indicateurContexte({
          year: 2024,
          type: "PREVISIONNEL",
          tauxEncadrement: 1,
        }),
        indicateurContexte({
          year: 2024,
          type: "REALISE",
          tauxEncadrement: 12,
        }),
      ],
    });

    expect(detections).toEqual([]);
  });

  it("ignore un taux d'encadrement non renseigné", () => {
    const detections = detectionsDe("TAUX_ENCADREMENT_LT_2", {
      structure: structureContexte(),
      indicateurs: [indicateurContexte({ tauxEncadrement: null })],
    });

    expect(detections).toEqual([]);
  });
});
