import { detectionsDe } from "tests/test-utils/anomalie";
import {
  structureContexte,
  typologieContexte,
} from "tests/test-utils/factories/anomalie-contexte.factory";
import { describe, expect, it } from "vitest";

describe("places par typologie", () => {
  it("signale l'exercice où les places labellisées dépassent les places autorisées", () => {
    const detections = detectionsDe("PLACES_LABELLISEES_GT_AUTORISEES", {
      typologies: [
        typologieContexte({ year: 2023, placesAutorisees: 100, lgbt: 10 }),
        typologieContexte({ year: 2024, placesAutorisees: 100, lgbt: 120 }),
      ],
    });

    expect(detections).toEqual([{ year: 2024, targetId: 0 }]);
  });

  it("teste chaque typologie séparément et non leur somme", () => {
    const typologies = [
      typologieContexte({
        year: 2024,
        placesAutorisees: 100,
        lgbt: 60,
        fvvTeh: 60,
        pmr: 60,
      }),
    ];

    expect(
      detectionsDe("PLACES_LABELLISEES_GT_AUTORISEES", { typologies })
    ).toEqual([]);
    expect(
      detectionsDe("PLACES_SPECIALISEES_GT_AUTORISEES", { typologies })
    ).toEqual([]);
    expect(detectionsDe("PLACES_PMR_GT_AUTORISEES", { typologies })).toEqual(
      []
    );
  });

  it("ignore les millésimes postérieurs à l'année courante", () => {
    const detections = detectionsDe("PLACES_PMR_GT_AUTORISEES", {
      typologies: [
        typologieContexte({ year: 2030, placesAutorisees: 100, pmr: 200 }),
      ],
    });

    expect(detections).toEqual([]);
  });
});

describe("PLACES_ADRESSES_ECART_STRUCTURE", () => {
  it("signale un écart supérieur à 10 %", () => {
    const detections = detectionsDe("PLACES_ADRESSES_ECART_STRUCTURE", {
      structure: structureContexte({ placesAutorisees: 100 }),
      adresses: [{ id: 1, placesAutorisees: 80 }],
    });

    expect(detections).toEqual([{ year: 0, targetId: 0 }]);
  });

  it("accepte un écart de 10 % exactement", () => {
    const detections = detectionsDe("PLACES_ADRESSES_ECART_STRUCTURE", {
      structure: structureContexte({ placesAutorisees: 100 }),
      adresses: [{ id: 1, placesAutorisees: 90 }],
    });

    expect(detections).toEqual([]);
  });

  it("ne signale rien quand la structure n'a pas de places autorisées", () => {
    const detections = detectionsDe("PLACES_ADRESSES_ECART_STRUCTURE", {
      structure: structureContexte({ placesAutorisees: null }),
      adresses: [{ id: 1, placesAutorisees: 50 }],
    });

    expect(detections).toEqual([]);
  });
});

describe("INCOHERENCE_LGBT_PLACES", () => {
  it("signale l'exercice où l'indicateur est positif sans aucune place LGBT", () => {
    const detections = detectionsDe("INCOHERENCE_LGBT_PLACES", {
      structure: structureContexte({ lgbt: true }),
      typologies: [typologieContexte({ year: 2024, lgbt: 0 })],
    });

    expect(detections).toEqual([{ year: 2024, targetId: 0 }]);
  });

  it("signale l'exercice où l'indicateur est négatif avec des places LGBT", () => {
    const detections = detectionsDe("INCOHERENCE_LGBT_PLACES", {
      structure: structureContexte({ lgbt: false }),
      typologies: [typologieContexte({ year: 2024, lgbt: 5 })],
    });

    expect(detections).toEqual([{ year: 2024, targetId: 0 }]);
  });

  it("ne signale que les exercices incohérents avec l'indicateur de la version active", () => {
    const detections = detectionsDe("INCOHERENCE_LGBT_PLACES", {
      structure: structureContexte({ lgbt: true }),
      typologies: [
        typologieContexte({ year: 2023, lgbt: 0 }),
        typologieContexte({ year: 2024, lgbt: 5 }),
        typologieContexte({ year: 2025, lgbt: 0 }),
      ],
    });

    expect(detections).toEqual([
      { year: 2023, targetId: 0 },
      { year: 2025, targetId: 0 },
    ]);
  });

  it("ne signale rien quand l'indicateur n'est pas renseigné", () => {
    const detections = detectionsDe("INCOHERENCE_LGBT_PLACES", {
      structure: structureContexte({ lgbt: null }),
      typologies: [typologieContexte({ lgbt: 5 })],
    });

    expect(detections).toEqual([]);
  });
});
