import type {
  StatistiqueDbAdresse,
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTypologie,
  StatistiquesActivityContext,
  StatistiquesContext,
} from "@/app/api/statistiques/statistiques.db.type";
import {
  buildActivityIndex,
  buildStatistiquesActivityContext,
  createEmptyActiveStructureIdsByPeriod,
  getTypologieYears,
} from "@/app/api/statistiques/statistiques.utils";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

export const testStructure = (
  id: number,
  departementAdministratif: string,
  type: StructureType = StructureType.CADA
): StatistiqueDbStructure => ({ id, type, departementAdministratif });

export const testTypologie = (
  id: number,
  structureId: number,
  year: number,
  placesAutorisees: number,
  pmr = 0
): StatistiqueDbTypologie => ({
  id,
  structureId,
  year,
  placesAutorisees,
  pmr,
  lgbt: 0,
  fvvTeh: 0,
});

export const testAdresse = (
  id: number,
  structureId: number,
  qpv: number
): StatistiqueDbAdresse => ({
  id,
  structureId,
  structureVersionId: structureId,
  repartition: Repartition.COLLECTIF,
  placesAutorisees: 0,
  qpv,
  logementSocial: 0,
});

type BuildTestStructureVersionTimelineEntry = {
  structureId: number;
  structureVersionId?: number;
  effectiveDate?: Date;
  placesAutorisees?: number | null;
};

export const buildTestStructureVersionTimeline = (
  entries: BuildTestStructureVersionTimelineEntry[] | number[],
  defaultEffectiveDate = new Date("2000-01-01T00:00:00.000Z")
): StatistiqueDbStructureVersionTimeline[] => {
  const normalized = (
    typeof entries[0] === "number"
      ? (entries as number[]).map((structureId) => ({ structureId }))
      : entries
  ) as BuildTestStructureVersionTimelineEntry[];

  return normalized.map((entry) => ({
    id: entry.structureVersionId ?? entry.structureId,
    structureId: entry.structureId,
    effectiveDate: entry.effectiveDate ?? defaultEffectiveDate,
    placesAutorisees: entry.placesAutorisees ?? null,
  }));
};

export const buildTestDnaLinks = (
  entries: Array<{
    structureId: number;
    dnaCode: string;
    structureVersionId?: number;
    id?: number;
  }>
): StatistiqueDbDnaLink[] =>
  entries.map((entry, index) => ({
    id: entry.id ?? index + 1,
    structureId: entry.structureId,
    structureVersionId: entry.structureVersionId ?? entry.structureId,
    dna: { code: entry.dnaCode },
  }));

type BuildTestActivityContextOptions = {
  openingDate?: Date;
  closureDates?: Map<number, Date | null>;
};

export const buildTestActivityContext = (
  structureIds: number[],
  options: BuildTestActivityContextOptions = {}
): StatistiquesActivityContext => {
  const openingDate =
    options.openingDate ?? new Date("2000-01-01T00:00:00.000Z");
  const closureDates =
    options.closureDates ??
    new Map(structureIds.map((structureId) => [structureId, null]));

  return buildStatistiquesActivityContext(
    structureIds,
    structureIds.map((structureId) => ({
      id: structureId,
      creationDate: openingDate,
      fermetureDate: closureDates.get(structureId) ?? null,
    }))
  );
};

export type BuildTestActiveStructureIdsByPeriodOptions =
  BuildTestActivityContextOptions & {
    referenceDate?: Date;
    typologieYears?: number[];
    referenceYear?: number;
    periodDates?: (Date | string | null | undefined)[];
    financeYears?: number[];
  };

export const buildTestActivityIndex = (
  structureIds: number[],
  options: BuildTestActiveStructureIdsByPeriodOptions = {}
): {
  activeStructureIdsNow: Set<number>;
  activeStructureIdsByPeriod: StatistiquesContext["activeStructureIdsByPeriod"];
} => {
  const activityContext = buildTestActivityContext(structureIds, options);
  const activeStructureIdsByPeriod = createEmptyActiveStructureIdsByPeriod();
  const referenceDate = options.referenceDate ?? new Date();

  const activeStructureIdsNow = buildActivityIndex(
    activityContext,
    activeStructureIdsByPeriod,
    {
      referenceDate,
      typologieYears: options.typologieYears ?? [2023, 2024, 2025, 2026],
      referenceYear: options.referenceYear ?? referenceDate.getUTCFullYear(),
      periodDates: options.periodDates ?? [],
      financeYears: options.financeYears,
    }
  );

  return { activeStructureIdsNow, activeStructureIdsByPeriod };
};

export const buildTestActiveStructureIdsByPeriod = (
  structureIds: number[],
  options: BuildTestActiveStructureIdsByPeriodOptions = {}
): StatistiquesContext["activeStructureIdsByPeriod"] =>
  buildTestActivityIndex(structureIds, options).activeStructureIdsByPeriod;

export const buildTestStatistiquesContext = (
  partial: Pick<
    StatistiquesContext,
    "structures" | "typologies" | "adresses" | "departements"
  > &
    Partial<
      Pick<
        StatistiquesContext,
        | "cpomLinks"
        | "dnaLinks"
        | "structureVersionTimeline"
        | "allStructures"
        | "activeStructureIdsNow"
        | "activeStructureIdsByPeriod"
        | "eigs"
        | "evaluations"
        | "budgets"
        | "indicateurs"
        | "activites"
        | "rmus"
      >
    >
): StatistiquesContext => {
  const structures = partial.structures;
  const allStructures = partial.allStructures ?? structures;
  const allStructureIds = allStructures.map((structure) => structure.id);

  const referenceDate = new Date();
  const activeStructureIdsByPeriod =
    partial.activeStructureIdsByPeriod ??
    createEmptyActiveStructureIdsByPeriod();
  const activeStructureIdsNow =
    partial.activeStructureIdsNow ??
    buildActivityIndex(
      buildTestActivityContext(allStructureIds),
      activeStructureIdsByPeriod,
      {
        referenceDate,
        typologieYears: getTypologieYears(partial.typologies),
        referenceYear: 2026,
        periodDates: [],
      }
    );

  return {
    structures,
    allStructures,
    activeStructureIdsNow,
    activeStructureIdsByPeriod,
    eigs: partial.eigs ?? [],
    evaluations: partial.evaluations ?? [],
    typologies: partial.typologies,
    adresses: partial.adresses,
    departements: partial.departements,
    cpomLinks: partial.cpomLinks ?? [],
    dnaLinks: partial.dnaLinks ?? [],
    structureVersionTimeline:
      partial.structureVersionTimeline ??
      buildTestStructureVersionTimeline(allStructureIds),
    budgets: partial.budgets ?? [],
    indicateurs: partial.indicateurs ?? [],
    activites: partial.activites ?? [],
    rmus: partial.rmus !== undefined ? partial.rmus : [],
  };
};
