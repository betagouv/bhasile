import { detectionsOf } from "tests/test-utils/anomalie";
import {
  acteContext,
  structureContext,
} from "tests/test-utils/factories/anomalie-context.factory";
import { describe, expect, it } from "vitest";

import { ANOMALIE_TARGET_STRUCTURE } from "@/types/anomalie.type";
import { StructureType } from "@/types/structure.type";

const onStructure = [{ year: 0, targetId: ANOMALIE_TARGET_STRUCTURE }];

describe("AUTORISATION_DUREE_NOT_15Y", () => {
  it("signale l'arrêté d'autorisation dont la durée n'est pas de 15 ans", () => {
    const detections = detectionsOf("AUTORISATION_DUREE_NOT_15Y", {
      structure: structureContext(),
      actes: [
        acteContext({
          id: 7,
          category: "ARRETE_AUTORISATION",
          startDate: new Date("2010-01-01"),
          endDate: new Date("2022-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([{ year: 0, targetId: 7 }]);
  });

  it("ignore un arrêté de 15 ans", () => {
    const detections = detectionsOf("AUTORISATION_DUREE_NOT_15Y", {
      structure: structureContext(),
      actes: [
        acteContext({
          category: "ARRETE_AUTORISATION",
          startDate: new Date("2010-01-01"),
          endDate: new Date("2025-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([]);
  });

  it("ne s'applique pas à une structure subventionnée", () => {
    const detections = detectionsOf("AUTORISATION_DUREE_NOT_15Y", {
      structure: structureContext({ type: StructureType.HUDA }),
      actes: [
        acteContext({
          category: "ARRETE_AUTORISATION",
          startDate: new Date("2010-01-01"),
          endDate: new Date("2022-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([]);
  });
});

describe("CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y", () => {
  it("signale une convention de plus de 3 ans", () => {
    const detections = detectionsOf("CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y", {
      structure: structureContext({ type: StructureType.HUDA }),
      actes: [
        acteContext({
          id: 3,
          startDate: new Date("2020-01-01"),
          endDate: new Date("2024-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([{ year: 0, targetId: 3 }]);
  });

  it("accepte une convention de 3 ans", () => {
    const detections = detectionsOf("CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y", {
      structure: structureContext({ type: StructureType.HUDA }),
      actes: [
        acteContext({
          startDate: new Date("2020-01-01"),
          endDate: new Date("2023-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([]);
  });
});

describe("CONVENTION_HORS_PERIODE_AUTORISATION", () => {
  const autorisation = acteContext({
    id: 1,
    category: "ARRETE_AUTORISATION",
    startDate: new Date("2015-01-01"),
    endDate: new Date("2030-01-01"),
  });

  it("signale la convention qui déborde de toute période d'autorisation", () => {
    const detections = detectionsOf("CONVENTION_HORS_PERIODE_AUTORISATION", {
      structure: structureContext(),
      actes: [
        autorisation,
        acteContext({
          id: 2,
          startDate: new Date("2014-01-01"),
          endDate: new Date("2019-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([{ year: 0, targetId: 2 }]);
  });

  it("accepte la convention incluse dans une période d'autorisation", () => {
    const detections = detectionsOf("CONVENTION_HORS_PERIODE_AUTORISATION", {
      structure: structureContext(),
      actes: [
        autorisation,
        acteContext({
          id: 2,
          startDate: new Date("2020-01-01"),
          endDate: new Date("2025-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([]);
  });

  it("ne signale rien en l'absence d'arrêté d'autorisation daté", () => {
    const detections = detectionsOf("CONVENTION_HORS_PERIODE_AUTORISATION", {
      structure: structureContext(),
      actes: [acteContext({ id: 2 })],
    });

    expect(detections).toEqual([]);
  });
});

describe("CONVENTION_MANQUANTE_OU_EXPIREE", () => {
  it("signale une structure autorisée sans convention datée", () => {
    const detections = detectionsOf("CONVENTION_MANQUANTE_OU_EXPIREE", {
      structure: structureContext(),
      actes: [],
    });

    expect(detections).toEqual(onStructure);
  });
});

describe("EVALUATION_HORS_DELAI", () => {
  const actes = [
    acteContext({
      startDate: new Date("2020-01-01"),
      endDate: new Date("2025-01-01"),
    }),
  ];

  it("signale l'absence totale d'évaluation", () => {
    const detections = detectionsOf("EVALUATION_HORS_DELAI", {
      structure: structureContext(),
      actes,
      evaluations: [],
    });

    expect(detections).toEqual(onStructure);
  });

  it("signale une évaluation antérieure de plus de 5 ans à la fin de convention", () => {
    const detections = detectionsOf("EVALUATION_HORS_DELAI", {
      structure: structureContext(),
      actes,
      evaluations: [{ date: new Date("2019-01-01") }],
    });

    expect(detections).toEqual(onStructure);
  });

  it("accepte une évaluation dans les 5 ans précédant la fin de convention", () => {
    const detections = detectionsOf("EVALUATION_HORS_DELAI", {
      structure: structureContext(),
      actes,
      evaluations: [{ date: new Date("2022-01-01") }],
    });

    expect(detections).toEqual([]);
  });
});
