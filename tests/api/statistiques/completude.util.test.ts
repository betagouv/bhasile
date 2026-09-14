import { describe, expect, it } from "vitest";

import {
  buildLastValidatedCampagneYearByStructureId,
  computeYearCompletude,
  resolveExpectedStructureIds,
} from "@/app/api/statistiques/completude.util";
import type {
  StatistiqueDbStructure,
  StatistiqueDbValidatedActualisation,
  StatistiquesCompletudeContext,
} from "@/app/api/statistiques/statistiques.db.type";
import { CompletudeReason } from "@/schemas/api/statistique.schema";
import { StructureType } from "@/types/structure.type";

const NOW = new Date("2026-09-10T12:00:00.000Z");

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
  formDefinition: { slug: `actualisation-${year}`, deadline: null },
});

const buildContext = ({
  finalisedStructureIds = [1, 2],
  campagnes = [{ year: 2026, deadline: new Date("2026-09-30T00:00:00.000Z") }],
  validated = [] as StatistiqueDbValidatedActualisation[],
  closureDates = [] as [number, Date][],
}: {
  finalisedStructureIds?: number[];
  campagnes?: { year: number; deadline: Date | null }[];
  validated?: StatistiqueDbValidatedActualisation[];
  closureDates?: [number, Date][];
} = {}): StatistiquesCompletudeContext => ({
  finalisedStructureIds: new Set(finalisedStructureIds),
  actualisationFormDefinitions: campagnes.map((campagne) => ({
    slug: `actualisation-${campagne.year}`,
    deadline: campagne.deadline,
  })),
  lastValidatedCampagneYearByStructureId:
    buildLastValidatedCampagneYearByStructureId(validated),
  closureDateByStructureId: new Map<number, Date | null>(closureDates),
});

describe("resolveExpectedStructureIds", () => {
  it("ne retient que les structures dont l'initialisation est validée", () => {
    const context = buildContext({ finalisedStructureIds: [1] });

    expect(
      resolveExpectedStructureIds(
        context,
        [testStructure(1), testStructure(2)],
        2026
      )
    ).toEqual(new Set([1]));
  });

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
        formDefinition: { slug: "actualisation-2026", deadline: null },
      },
      {
        structureId: 3,
        formDefinition: { slug: "actualisation-v1", deadline: null },
      },
    ]);

    expect(map.size).toBe(0);
  });
});

describe("computeYearCompletude", () => {
  it("considère complètes les années antérieures à la première campagne", () => {
    const context = buildContext();

    expect(computeYearCompletude(context, 2024, new Set([1, 2]), NOW)).toEqual({
      isComplete: true,
      reason: null,
      nbAttendues: 0,
      nbRenseignees: 0,
    });
  });

  it("compte une structure à jour sur l'année de campagne validée", () => {
    const context = buildContext({
      validated: [testValidatedActualisation(1, 2026)],
    });

    expect(computeYearCompletude(context, 2026, new Set([1, 2]), NOW)).toEqual({
      isComplete: false,
      reason: CompletudeReason.SAISIE_EN_COURS,
      nbAttendues: 2,
      nbRenseignees: 1,
    });
  });

  it("atteste toutes les années jusqu'à la campagne validée incluse", () => {
    const context = buildContext({
      validated: [
        testValidatedActualisation(1, 2026),
        testValidatedActualisation(2, 2026),
      ],
    });

    expect(computeYearCompletude(context, 2025, new Set([1, 2]), NOW)).toEqual({
      isComplete: true,
      reason: null,
      nbAttendues: 2,
      nbRenseignees: 2,
    });
  });

  it("ne compte pas une campagne antérieure à l'année demandée", () => {
    const context = buildContext({
      campagnes: [
        { year: 2026, deadline: new Date("2026-08-31T00:00:00.000Z") },
        { year: 2027, deadline: new Date("2027-09-30T00:00:00.000Z") },
      ],
      validated: [testValidatedActualisation(1, 2026)],
    });

    expect(computeYearCompletude(context, 2027, new Set([1]), NOW)).toEqual({
      isComplete: false,
      reason: CompletudeReason.SAISIE_EN_COURS,
      nbAttendues: 1,
      nbRenseignees: 0,
    });
  });

  it("qualifie la saisie d'incomplète quand plus aucune campagne n'est ouverte", () => {
    const context = buildContext({
      campagnes: [
        { year: 2026, deadline: new Date("2026-08-31T00:00:00.000Z") },
      ],
    });

    expect(computeYearCompletude(context, 2026, new Set([1, 2]), NOW)).toEqual({
      isComplete: false,
      reason: CompletudeReason.SAISIE_INCOMPLETE,
      nbAttendues: 2,
      nbRenseignees: 0,
    });
  });

  it("considère complète une année sans structure attendue", () => {
    const context = buildContext();

    expect(computeYearCompletude(context, 2026, new Set(), NOW)).toEqual({
      isComplete: true,
      reason: null,
      nbAttendues: 0,
      nbRenseignees: 0,
    });
  });
});
