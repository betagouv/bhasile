import { describe, expect, it } from "vitest";

import {
  buildLastValidatedCampagneYearByStructureId,
  resolveExpectedStructureIds,
  resolveStructuresForYear,
} from "@/app/api/statistiques/completude.util";
import type {
  StatistiqueDbStructure,
  StatistiqueDbValidatedActualisation,
  StatistiquesCompletudeContext,
} from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

const testStructure = (id: number): StatistiqueDbStructure => ({
  id,
  type: StructureType.CADA,
  departementAdministratif: "01",
});

const testValidatedActualisation = (
  structureId: number,
  year: number
): StatistiqueDbValidatedActualisation => ({
  structureId,
  formDefinition: { slug: `actualisation-${year}` },
});

const buildContext = ({
  campagnes = [2026],
  validated = [] as StatistiqueDbValidatedActualisation[],
  closureDates = [] as [number, Date][],
}: {
  campagnes?: number[];
  validated?: StatistiqueDbValidatedActualisation[];
  closureDates?: [number, Date][];
} = {}): StatistiquesCompletudeContext => ({
  actualisationFormDefinitions: campagnes.map((year) => ({
    slug: `actualisation-${year}`,
  })),
  lastValidatedCampagneYearByStructureId:
    buildLastValidatedCampagneYearByStructureId(validated),
  closureDateByStructureId: new Map<number, Date | null>(closureDates),
});

describe("resolveExpectedStructureIds", () => {
  it("exclut une structure fermée dans l'année concernée", () => {
    const context = buildContext({
      closureDates: [[2, new Date("2026-06-30T00:00:00.000Z")]],
    });

    expect(
      resolveExpectedStructureIds(
        context,
        [testStructure(1), testStructure(2)],
        2026
      )
    ).toEqual(new Set([1]));
  });

  it("exclut des années suivantes une structure fermée l'année précédente", () => {
    const context = buildContext({
      closureDates: [[2, new Date("2026-06-30T00:00:00.000Z")]],
    });

    expect(
      resolveExpectedStructureIds(
        context,
        [testStructure(1), testStructure(2)],
        2027
      )
    ).toEqual(new Set([1]));
  });

  it("garde une structure fermée après l'année concernée", () => {
    const context = buildContext({
      closureDates: [[2, new Date("2027-03-01T00:00:00.000Z")]],
    });

    expect(
      resolveExpectedStructureIds(
        context,
        [testStructure(1), testStructure(2)],
        2026
      )
    ).toEqual(new Set([1, 2]));
  });
});

describe("buildLastValidatedCampagneYearByStructureId", () => {
  it("garde la campagne validée la plus récente par structure", () => {
    const map = buildLastValidatedCampagneYearByStructureId([
      testValidatedActualisation(1, 2026),
      testValidatedActualisation(1, 2027),
      testValidatedActualisation(2, 2026),
    ]);

    expect(map.get(1)).toBe(2027);
    expect(map.get(2)).toBe(2026);
  });

  it("ignore les formulaires sans structure et les slugs non numériques", () => {
    const map = buildLastValidatedCampagneYearByStructureId([
      {
        structureId: null,
        formDefinition: { slug: "actualisation-2026" },
      },
      {
        structureId: 3,
        formDefinition: { slug: "actualisation-v1" },
      },
    ]);

    expect(map.size).toBe(0);
  });
});

describe("resolveStructuresForYear", () => {
  const structures = [testStructure(1), testStructure(2)];

  it("garde toutes les structures sans score sur une année d'initialisation", () => {
    const context = buildContext();

    expect(resolveStructuresForYear(context, structures, 2024)).toEqual({
      structures,
      completude: null,
    });
  });

  it("garde toutes les structures sans score tant qu'aucune campagne n'existe", () => {
    const context = buildContext({ campagnes: [] });

    expect(resolveStructuresForYear(context, structures, 2026)).toEqual({
      structures,
      completude: null,
    });
  });

  it("ne comptabilise que les structures actualisées sur une année de campagne", () => {
    const context = buildContext({
      validated: [testValidatedActualisation(1, 2026)],
    });

    expect(resolveStructuresForYear(context, structures, 2026)).toEqual({
      structures: [testStructure(1)],
      completude: {
        isComplete: false,
        nbAttendues: 2,
        nbRenseignees: 1,
      },
    });
  });

  it("couvre l'année précédant la première campagne", () => {
    const context = buildContext({
      validated: [
        testValidatedActualisation(1, 2026),
        testValidatedActualisation(2, 2026),
      ],
    });

    expect(resolveStructuresForYear(context, structures, 2025)).toEqual({
      structures,
      completude: {
        isComplete: true,
        nbAttendues: 2,
        nbRenseignees: 2,
      },
    });
  });

  it("ne déplace pas la frontière avec les campagnes suivantes", () => {
    const context = buildContext({
      campagnes: [
        2026,
        2027,
      ],
      validated: [testValidatedActualisation(1, 2026)],
    });

    expect(
      resolveStructuresForYear(context, structures, 2024).completude
    ).toBeNull();
    expect(
      resolveStructuresForYear(context, [testStructure(1)], 2027)
    ).toEqual({
      structures: [],
      completude: {
        isComplete: false,
        nbAttendues: 1,
        nbRenseignees: 0,
      },
    });
  });

  it("compte une structure actualisée puis fermée dans l'année comme attendue", () => {
    const context = buildContext({
      validated: [testValidatedActualisation(2, 2026)],
      closureDates: [[2, new Date("2026-06-30T00:00:00.000Z")]],
    });

    expect(resolveStructuresForYear(context, structures, 2026)).toEqual({
      structures: [testStructure(2)],
      completude: {
        isComplete: false,
        nbAttendues: 2,
        nbRenseignees: 1,
      },
    });
  });
});
