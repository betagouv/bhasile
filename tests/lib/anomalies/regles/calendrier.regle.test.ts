import { detectionsDe } from "tests/test-utils/anomalie";
import {
  acteContexte,
  structureContexte,
} from "tests/test-utils/factories/anomalie-contexte.factory";
import { describe, expect, it } from "vitest";

import { ANOMALIE_TARGET_STRUCTURE } from "@/types/anomalie.type";
import { StructureType } from "@/types/structure.type";

const surStructure = [{ year: 0, targetId: ANOMALIE_TARGET_STRUCTURE }];

describe("AUTORISATION_DUREE_NOT_15Y", () => {
  it("signale l'arrêté d'autorisation dont la durée n'est pas de 15 ans", () => {
    const detections = detectionsDe("AUTORISATION_DUREE_NOT_15Y", {
      structure: structureContexte(),
      actes: [
        acteContexte({
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
    const detections = detectionsDe("AUTORISATION_DUREE_NOT_15Y", {
      structure: structureContexte(),
      actes: [
        acteContexte({
          category: "ARRETE_AUTORISATION",
          startDate: new Date("2010-01-01"),
          endDate: new Date("2025-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([]);
  });

  it("ne s'applique pas à une structure subventionnée", () => {
    const detections = detectionsDe("AUTORISATION_DUREE_NOT_15Y", {
      structure: structureContexte({ type: StructureType.HUDA }),
      actes: [
        acteContexte({
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
    const detections = detectionsDe("CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y", {
      structure: structureContexte({ type: StructureType.HUDA }),
      actes: [
        acteContexte({
          id: 3,
          startDate: new Date("2020-01-01"),
          endDate: new Date("2024-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([{ year: 0, targetId: 3 }]);
  });

  it("accepte une convention de 3 ans", () => {
    const detections = detectionsDe("CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y", {
      structure: structureContexte({ type: StructureType.HUDA }),
      actes: [
        acteContexte({
          startDate: new Date("2020-01-01"),
          endDate: new Date("2023-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([]);
  });
});

describe("CONVENTION_HORS_PERIODE_AUTORISATION", () => {
  const autorisation = acteContexte({
    id: 1,
    category: "ARRETE_AUTORISATION",
    startDate: new Date("2015-01-01"),
    endDate: new Date("2030-01-01"),
  });

  it("signale la convention qui déborde de toute période d'autorisation", () => {
    const detections = detectionsDe("CONVENTION_HORS_PERIODE_AUTORISATION", {
      structure: structureContexte(),
      actes: [
        autorisation,
        acteContexte({
          id: 2,
          startDate: new Date("2014-01-01"),
          endDate: new Date("2019-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([{ year: 0, targetId: 2 }]);
  });

  it("accepte la convention incluse dans une période d'autorisation", () => {
    const detections = detectionsDe("CONVENTION_HORS_PERIODE_AUTORISATION", {
      structure: structureContexte(),
      actes: [
        autorisation,
        acteContexte({
          id: 2,
          startDate: new Date("2020-01-01"),
          endDate: new Date("2025-01-01"),
        }),
      ],
    });

    expect(detections).toEqual([]);
  });

  it("ne signale rien en l'absence d'arrêté d'autorisation daté", () => {
    const detections = detectionsDe("CONVENTION_HORS_PERIODE_AUTORISATION", {
      structure: structureContexte(),
      actes: [acteContexte({ id: 2 })],
    });

    expect(detections).toEqual([]);
  });
});

describe("CONVENTION_MANQUANTE_OU_EXPIREE", () => {
  it("signale une structure autorisée sans convention datée", () => {
    const detections = detectionsDe("CONVENTION_MANQUANTE_OU_EXPIREE", {
      structure: structureContexte(),
      actes: [],
    });

    expect(detections).toEqual(surStructure);
  });
});

describe("EVALUATION_HORS_DELAI", () => {
  const actes = [
    acteContexte({
      startDate: new Date("2020-01-01"),
      endDate: new Date("2025-01-01"),
    }),
  ];

  it("signale l'absence totale d'évaluation", () => {
    const detections = detectionsDe("EVALUATION_HORS_DELAI", {
      structure: structureContexte(),
      actes,
      evaluations: [],
    });

    expect(detections).toEqual(surStructure);
  });

  it("signale une évaluation antérieure de plus de 5 ans à la fin de convention", () => {
    const detections = detectionsDe("EVALUATION_HORS_DELAI", {
      structure: structureContexte(),
      actes,
      evaluations: [{ date: new Date("2019-01-01") }],
    });

    expect(detections).toEqual(surStructure);
  });

  it("accepte une évaluation dans les 5 ans précédant la fin de convention", () => {
    const detections = detectionsDe("EVALUATION_HORS_DELAI", {
      structure: structureContexte(),
      actes,
      evaluations: [{ date: new Date("2022-01-01") }],
    });

    expect(detections).toEqual([]);
  });
});
