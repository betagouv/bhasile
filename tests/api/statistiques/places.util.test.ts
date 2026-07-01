import { describe, expect, it } from "vitest";

import { computePlacesStatistiques } from "@/app/api/statistiques/places/places.util";
import type {
  StatistiqueDbAdresse,
  StatistiqueDbDepartement,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "@/app/api/statistiques/statistiques.db.type";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActivityIndex,
  buildTestStatistiquesContext,
} from "./test-helpers";

const REFERENCE_DATE = new Date("2025-06-15T12:00:00.000Z");

const testStructure = (
  id: number,
  type: StructureType = StructureType.CADA,
  departementAdministratif = "01"
): StatistiqueDbStructure => ({
  id,
  type,
  departementAdministratif,
});

const testTypologie = (
  id: number,
  structureId: number,
  year: number,
  placesAutorisees: number,
  overrides: Partial<
    Pick<StatistiqueDbTypologie, "pmr" | "lgbt" | "fvvTeh">
  > = {}
): StatistiqueDbTypologie => ({
  id,
  structureId,
  year,
  placesAutorisees,
  pmr: overrides.pmr !== undefined ? overrides.pmr : 0,
  lgbt: overrides.lgbt !== undefined ? overrides.lgbt : 0,
  fvvTeh: overrides.fvvTeh !== undefined ? overrides.fvvTeh : 0,
});

const testAdresse = (
  id: number,
  structureId: number,
  overrides: Partial<Pick<StatistiqueDbAdresse, "qpv" | "logementSocial">> = {}
): StatistiqueDbAdresse => ({
  id,
  structureId,
  repartition: Repartition.COLLECTIF,
  placesAutorisees: 0,
  qpv: overrides.qpv ?? 0,
  logementSocial: overrides.logementSocial ?? 0,
});

const testDepartements = (): StatistiqueDbDepartement[] => [
  { id: 1, numero: "01", name: "Ain", population: 100_000 },
  { id: 2, numero: "02", name: "Aisne", population: 50_000 },
];

describe("places - agrégés sur le périmètre ouvert à la date de référence", () => {
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

  it("ne compte les places autorisées que pour les structures ouvertes disposant d'une typologie", () => {
    const {
      openStructures,
      allStructures,
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
    } = buildClosureContext();

    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: openStructures,
        allStructures,
        activeStructureIdsNow,
        activeStructureIdsByPeriod,
        typologies: [
          testTypologie(1, 1, 2025, 100),
          testTypologie(2, 2, 2025, 50),
          testTypologie(3, 3, 2025, 200),
        ],
        adresses: [],
        departements: testDepartements().slice(0, 1),
      })
    );

    expect(result.totalPlaces).toBe(150);
  });

  it("résout places autorisées et places spéciales typologie depuis le dernier millésime non nul par champ", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1)],
        typologies: [
          testTypologie(1, 1, 2023, 80, { pmr: 10, lgbt: 1, fvvTeh: 0 }),
          testTypologie(2, 1, 2025, 120, { pmr: null, lgbt: 3, fvvTeh: 2 }),
        ],
        adresses: [],
        departements: testDepartements().slice(0, 1),
      })
    );

    expect(result.totalPlaces).toBe(120);
    expect(result.pmr).toBe(10);
    expect(result.lgbt).toBe(3);
    expect(result.fvvTeh).toBe(2);
  });

  it("agrège qpv et logements sociaux depuis les adresses du périmètre version chargé", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [
          testStructure(1),
          testStructure(2, StructureType.CPH, "02"),
        ],
        typologies: [
          testTypologie(1, 1, 2025, 100),
          testTypologie(2, 2, 2025, 50),
        ],
        adresses: [
          testAdresse(10, 1, { qpv: 5, logementSocial: 2 }),
          testAdresse(11, 2, { qpv: 3, logementSocial: 1 }),
        ],
        departements: testDepartements().slice(0, 1),
      })
    );

    expect(result.qpv).toBe(8);
    expect(result.logementsSociaux).toBe(3); // Partir un jour
  });

  it("ignore les adresses rattachées à une structure sans typologie dans le périmètre", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [
          testStructure(1),
          testStructure(2, StructureType.CPH, "02"),
        ],
        typologies: [testTypologie(1, 1, 2025, 100)],
        adresses: [
          testAdresse(10, 1, { qpv: 5 }),
          testAdresse(11, 2, { qpv: 99 }),
        ],
        departements: testDepartements().slice(0, 1),
      })
    );

    expect(result.totalPlaces).toBe(100);
    expect(result.qpv).toBe(5);
  });
});

describe("places - taux d'équipement", () => {
  it("calcule le ratio places autorisées sur la population des départements filtrés", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [
          testStructure(1, StructureType.CADA, "01"),
          testStructure(2, StructureType.CPH, "02"),
        ],
        typologies: [
          testTypologie(1, 1, 2024, 100),
          testTypologie(2, 2, 2024, 50),
        ],
        adresses: [],
        departements: testDepartements(),
      })
    );

    expect(result.totalPlaces).toBe(150);
    expect(result.population).toBe(150_000);
    expect(result.tauxEquipement).toBe(0.001);
  });

  it("conserve un ratio faible non nul pour un grand département", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1, StructureType.CADA, "75")],
        typologies: [testTypologie(1, 1, 2024, 4155)],
        adresses: [],
        departements: [
          { id: 1, numero: "75", name: "Paris", population: 59_931_329 },
        ],
      })
    );

    expect(result.tauxEquipement).toBe(0.000_069_3);
    expect(result.tauxEquipement).not.toBe(0);
  });

  it("renvoie un taux nul si une population départementale manque", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1)],
        typologies: [testTypologie(1, 1, 2024, 100)],
        adresses: [],
        departements: [{ id: 1, numero: "01", name: "Ain", population: null }],
      })
    );

    expect(result.tauxEquipement).toBeNull();
    expect(result.population).toBeNull();
  });
});

describe("places - indicateurs annuels (byYear)", () => {
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

    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: openStructures,
        allStructures,
        activeStructureIdsNow,
        activeStructureIdsByPeriod,
        typologies: closureFixture.structureIds.map((structureId) =>
          testTypologie(structureId, structureId, 2025, 10)
        ),
        adresses: [],
        departements: testDepartements().slice(0, 1),
      })
    );

    expect(result.totalPlaces).toBe(20);
    expect(result.byYear).toContainEqual(
      expect.objectContaining({ year: 2025, totalPlaces: 30 })
    );
  });

  it("applique le millésime exact de typologie pour chaque année", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [
          testStructure(1),
          testStructure(2, StructureType.CPH, "02"),
        ],
        allStructures: [
          testStructure(1),
          testStructure(2, StructureType.CPH, "02"),
        ],
        typologies: [
          testTypologie(1, 1, 2023, 80, { pmr: 4 }),
          testTypologie(2, 2, 2024, 60, { pmr: 6 }),
        ],
        adresses: [],
        departements: testDepartements().slice(0, 1),
      })
    );

    expect(result.byYear).toContainEqual(
      expect.objectContaining({ year: 2023, totalPlaces: 80, pmr: 4 })
    );
    expect(result.byYear).toContainEqual(
      expect.objectContaining({ year: 2024, totalPlaces: 60, pmr: 6 })
    );
  });

  it("reporte les qpv courants des adresses sur chaque millésime annuel", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [testStructure(1)],
        typologies: [
          testTypologie(1, 1, 2023, 80),
          testTypologie(2, 1, 2024, 100),
        ],
        adresses: [testAdresse(10, 1, { qpv: 7 })],
        departements: testDepartements().slice(0, 1),
      })
    );

    const year2023 = result.byYear.find((entry) => entry.year === 2023);
    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    expect(year2023?.qpv).toBe(7);
    expect(year2024?.qpv).toBe(7);
    expect(year2023?.totalPlaces).toBe(80);
    expect(year2024?.totalPlaces).toBe(100);
  });
});
