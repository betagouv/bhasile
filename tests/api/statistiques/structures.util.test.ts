import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbCpomStructure,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "@/app/api/statistiques/statistiques.db.type";
import { computeStructuresStatistiques } from "@/app/api/statistiques/structures/structures.util";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActivityIndex,
  buildTestStatistiquesContext,
  buildTestStructureVersionTimeline,
} from "./test-helpers";

const REFERENCE_DATE = new Date("2025-06-15T12:00:00.000Z");

const testStructure = (
  id: number,
  type: StructureType = StructureType.CADA
): StatistiqueDbStructure => ({
  id,
  type,
  departementAdministratif: "01",
});

const testTypologie = (
  id: number,
  structureId: number,
  year: number,
  placesAutorisees: number
): StatistiqueDbTypologie => ({
  id,
  structureId,
  year,
  placesAutorisees,
  pmr: 0,
  lgbt: 0,
  fvvTeh: 0,
});

const testAdresse = (
  id: number,
  structureId: number,
  repartition: Repartition,
  placesAutorisees: number,
  structureVersionId: number = structureId
): StatistiqueDbAdresse => ({
  id,
  structureId,
  structureVersionId,
  repartition,
  placesAutorisees,
  qpv: 0,
  logementSocial: 0,
});

const cpomLink = (
  id: number,
  cpomId: number,
  structureId: number,
  dateStart: string,
  dateEnd: string
): StatistiqueDbCpomStructure => ({
  id,
  cpomId,
  structureId,
  dateStart: new Date(dateStart),
  dateEnd: new Date(dateEnd),
  cpom: { actesAdministratifs: [] },
});

describe("structures - CPOM actifs à la date de référence", () => {
  beforeEach(() => {
    vi.setSystemTime(REFERENCE_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const typologies = [1, 2, 3].map((structureId) =>
    testTypologie(structureId, structureId, 2025, 10)
  );

  it("compte un CPOM actif rattaché à trois structures ouvertes", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [1, 2, 3].map((id) => testStructure(id)),
        typologies,
        adresses: [],
        departements: [],
        cpomLinks: [1, 2, 3].map((structureId) =>
          cpomLink(structureId, 100, structureId, "2024-01-01", "2025-12-31")
        ),
      })
    );

    expect(result.totalCpoms).toBe(1);
    expect(result.structuresAvecCpom).toBe(3);
  });

  it("ignore un CPOM dont la convention est terminée avant la date de référence", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1)],
        typologies: [testTypologie(1, 1, 2025, 10)],
        adresses: [],
        departements: [],
        cpomLinks: [
          cpomLink(1, 100, 1, "2024-01-01", "2025-12-31"),
          cpomLink(2, 101, 1, "2020-01-01", "2023-12-31"),
        ],
      })
    );

    expect(result.totalCpoms).toBe(1);
    expect(result.structuresAvecCpom).toBe(1);
  });

  it("ignore un CPOM dont la convention n'a pas encore démarré à la date de référence", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1)],
        typologies: [testTypologie(1, 1, 2025, 10)],
        adresses: [],
        departements: [],
        cpomLinks: [
          cpomLink(1, 100, 1, "2024-01-01", "2025-12-31"),
          cpomLink(2, 102, 1, "2026-01-01", "2027-12-31"),
        ],
      })
    );

    expect(result.totalCpoms).toBe(1);
    expect(result.structuresAvecCpom).toBe(1);
  });

  it("distingue deux CPOM actifs simultanés sur le même parc", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1), testStructure(2)],
        typologies: [
          testTypologie(1, 1, 2025, 10),
          testTypologie(2, 2, 2025, 10),
        ],
        adresses: [],
        departements: [],
        cpomLinks: [
          cpomLink(1, 100, 1, "2024-01-01", "2025-12-31"),
          cpomLink(2, 200, 2, "2024-01-01", "2025-12-31"),
        ],
      })
    );

    expect(result.totalCpoms).toBe(2);
    expect(result.structuresAvecCpom).toBe(2);
  });
});

describe("structures - répartition par type et bâti", () => {
  it("compte toutes les structures par type scalaire (places = 0 sans typologie)", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [
          testStructure(1, StructureType.CADA),
          testStructure(2, StructureType.CPH),
        ],
        typologies: [testTypologie(1, 1, 2024, 100)],
        adresses: [
          testAdresse(10, 1, Repartition.COLLECTIF, 100),
          testAdresse(11, 2, Repartition.DIFFUS, 50),
        ],
        departements: [],
      })
    );

    expect(result.totalStructures).toBe(2);
    // La structure 2 (CPH) n'a pas de typologie : comptée quand même, 0 place.
    expect(result.structureTypes).toContainEqual({
      type: StructureType.CADA,
      structures: 1,
      places: 100,
    });
    expect(result.structureTypes).toContainEqual({
      type: StructureType.CPH,
      structures: 1,
      places: 0,
    });
    // totalPlaces (autorisées) = Σ structureTypes.places ; totalPlacesAdresse = Σ places bâti.
    expect(result.totalPlaces).toBe(100);
    expect(result.totalPlacesAdresse).toBe(150);
    expect(result.structureTypes).not.toContainEqual(
      expect.objectContaining({ type: StructureType.PRAHDA })
    );
  });

  it("exclut du bâti une structure dont la version courante n'a pas d'adresse répartie", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [
          testStructure(1, StructureType.CADA),
          testStructure(2, StructureType.CPH),
        ],
        typologies: [testTypologie(1, 1, 2024, 100)],
        // Seule la structure 1 a une adresse répartie ; la 2 n'a pas de bâti.
        adresses: [testAdresse(10, 1, Repartition.COLLECTIF, 100)],
        departements: [],
      })
    );

    expect(result.totalStructures).toBe(2);
    // bâti × structures ne somme pas à 2 : la structure 2 est hors camembert bâti.
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.COLLECTIF,
      structures: 1,
      places: 100,
    });
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.DIFFUS,
      structures: 0,
      places: 0,
    });
    expect(result.totalPlacesAdresse).toBe(100);
  });

  it("reflète le type de la version effective transmise dans context.structures", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1, StructureType.CPH)],
        typologies: [testTypologie(1, 1, 2025, 40)],
        adresses: [],
        departements: [],
      })
    );

    expect(result.structureTypes).toContainEqual({
      type: StructureType.CPH,
      structures: 1,
      places: 40,
    });
    expect(result.structureTypes).toContainEqual({
      type: StructureType.CADA,
      structures: 0,
      places: 0,
    });
  });

  it("agrège une structure en bâti mixte et ventile les places par adresse", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1)],
        typologies: [testTypologie(1, 1, 2024, 100)],
        adresses: [
          testAdresse(10, 1, Repartition.COLLECTIF, 60),
          testAdresse(11, 1, Repartition.DIFFUS, 40),
        ],
        departements: [],
      })
    );

    expect(result.structureBatis).toContainEqual({
      bati: Repartition.MIXTE,
      structures: 1,
      places: 0,
    });
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.COLLECTIF,
      structures: 0,
      places: 60,
    });
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.DIFFUS,
      structures: 0,
      places: 40,
    });
  });

  it("ventile les places bâti à partir des adresses du périmètre version, pas de la typologie", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1)],
        typologies: [testTypologie(1, 1, 2024, 100)],
        adresses: [testAdresse(10, 1, Repartition.COLLECTIF, 60)],
        departements: [],
      })
    );

    expect(result.structureTypes).toContainEqual({
      type: StructureType.CADA,
      structures: 1,
      places: 100,
    });
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.COLLECTIF,
      structures: 1,
      places: 60,
    });
  });

  it("ne mélange pas une ancienne adresse (version révolue) avec l'adresse courante pour le bâti", () => {
    // Structure transformée : ancienne StructureVersion (101, COLLECTIF) remplacée
    // par une nouvelle (102, DIFFUS). Seule la version courante doit compter.
    const structureVersionTimeline = buildTestStructureVersionTimeline([
      {
        structureId: 1,
        structureVersionId: 101,
        effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
      },
      {
        structureId: 1,
        structureVersionId: 102,
        effectiveDate: new Date("2023-06-01T00:00:00.000Z"),
      },
    ]);

    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1)],
        structureVersionTimeline,
        typologies: [testTypologie(1, 1, 2024, 100)],
        adresses: [
          testAdresse(10, 1, Repartition.COLLECTIF, 60, 101),
          testAdresse(11, 1, Repartition.DIFFUS, 40, 102),
        ],
        departements: [],
      })
    );

    expect(result.structureBatis).toContainEqual({
      bati: Repartition.DIFFUS,
      structures: 1,
      places: 40,
    });
    expect(result.structureBatis).not.toContainEqual(
      expect.objectContaining({ bati: Repartition.MIXTE, structures: 1 })
    );
  });
});

describe("structures - indicateurs annuels (byYear)", () => {
  beforeEach(() => {
    vi.setSystemTime(REFERENCE_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const closureFixture = {
    referenceDate: REFERENCE_DATE,
    structureIds: [1, 2, 3],
    openingDate: new Date("2020-01-01T00:00:00.000Z"),
    closureDates: new Map<number, Date | null>([
      [1, null],
      [2, null],
      [3, new Date("2025-02-01T00:00:00.000Z")],
    ]),
    typologieYears: [2024, 2025],
    referenceYear: 2025,
    periodDates: [new Date("2025-03-01T00:00:00.000Z")],
  };

  const buildClosureContext = () => {
    const { activeStructureIdsNow, activeStructureIdsByPeriod } =
      buildTestActivityIndex(closureFixture.structureIds, closureFixture);
    const allStructures = closureFixture.structureIds.map((id) =>
      testStructure(id)
    );

    return {
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
      allStructures,
      openStructures: allStructures.filter((structure) =>
        activeStructureIdsNow.has(structure.id)
      ),
    };
  };

  it("distingue le total annuel du total au jour de référence", () => {
    const {
      openStructures,
      allStructures,
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
    } = buildClosureContext();

    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: openStructures,
        allStructures,
        activeStructureIdsNow,
        activeStructureIdsByPeriod,
        typologies: closureFixture.structureIds.map((structureId) =>
          testTypologie(structureId, structureId, 2025, 10)
        ),
        adresses: [],
        departements: [],
      })
    );

    expect(result.totalStructures).toBe(2);
    // totalPlaces global = structures ouvertes avec typologie (1 & 2) × 10 places.
    expect(result.totalPlaces).toBe(20);
    expect(result.byYear).toContainEqual(
      expect.objectContaining({ year: 2025, totalStructures: 3 })
    );
  });

  it("compte les CPOM actifs sur l'année civile, pas seulement au jour de référence", () => {
    const {
      openStructures,
      allStructures,
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
    } = buildClosureContext();

    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: openStructures,
        allStructures,
        activeStructureIdsNow,
        activeStructureIdsByPeriod,
        typologies: [
          testTypologie(1, 1, 2024, 10),
          testTypologie(2, 2, 2024, 10),
          testTypologie(3, 1, 2025, 10),
        ],
        adresses: [],
        departements: [],
        cpomLinks: [
          cpomLink(1, 100, 1, "2023-01-01", "2024-12-31"),
          cpomLink(2, 100, 2, "2023-01-01", "2024-12-31"),
          cpomLink(3, 101, 1, "2025-01-01", "2026-12-31"),
        ],
      })
    );

    const year2024 = result.byYear.find((entry) => entry.year === 2024);
    const year2025 = result.byYear.find((entry) => entry.year === 2025);

    expect(year2024?.totalCpoms).toBe(1);
    expect(year2025?.totalCpoms).toBe(1);
    expect(result.totalCpoms).toBe(1);
  });

  it("compte structuresAvecCpom (structures, pas contrats) distinctement de totalCpoms", () => {
    // One CPOM covering 2 structures: totalCpoms=1 but structuresAvecCpom=2.
    const {
      openStructures,
      allStructures,
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
    } = buildClosureContext();

    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: openStructures,
        allStructures,
        activeStructureIdsNow,
        activeStructureIdsByPeriod,
        typologies: [
          testTypologie(1, 1, 2024, 10),
          testTypologie(2, 2, 2024, 10),
        ],
        adresses: [],
        departements: [],
        cpomLinks: [
          cpomLink(1, 100, 1, "2023-01-01", "2024-12-31"),
          cpomLink(2, 100, 2, "2023-01-01", "2024-12-31"),
        ],
      })
    );

    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    expect(year2024?.totalCpoms).toBe(1);
    expect(year2024?.structuresAvecCpom).toBe(2);
  });

  it("applique le millésime exact de typologie pour chaque année", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1), testStructure(2)],
        allStructures: [testStructure(1), testStructure(2)],
        typologies: [
          testTypologie(1, 1, 2023, 10),
          testTypologie(2, 2, 2024, 10),
        ],
        adresses: [],
        departements: [],
      })
    );

    expect(result.byYear).toContainEqual(
      expect.objectContaining({ year: 2023, totalStructures: 1 })
    );
    expect(result.byYear).toContainEqual(
      expect.objectContaining({ year: 2024, totalStructures: 1 })
    );
  });
});
