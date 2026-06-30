import type {
  StatistiqueDbDnaLink,
  StatistiquesActivityContext,
  StatistiqueDbStructureVersionTimeline,
  StatistiquesContext,
} from "@/app/api/statistiques/statistiques.db.type";
import {
  buildActivityIndex,
  buildStatistiquesActivityContext,
  createEmptyActiveStructureIdsByPeriod,
  getTypologieYears,
} from "@/app/api/statistiques/statistiques.utils";
import { StructureType } from "@/types/structure.type";

type BuildTestStructureVersionTimelineEntry = {
  structureId: number;
  structureVersionId?: number;
  effectiveDate?: Date;
  type?: StructureType;
  departementAdministratif?: string;
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
    type: entry.type ?? StructureType.CADA,
    departementAdministratif: entry.departementAdministratif ?? "01",
    structureVersionTransformation: null,
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
  const openingDate = options.openingDate ?? new Date("2000-01-01T00:00:00.000Z");
  const closureDates =
    options.closureDates ??
    new Map(structureIds.map((structureId) => [structureId, null]));

  return buildStatistiquesActivityContext(
    structureIds,
    new Map(structureIds.map((structureId) => [structureId, openingDate])),
    closureDates
  );
};

type BuildTestActiveStructureIdsByPeriodOptions =
  BuildTestActivityContextOptions & {
    typologieYears?: number[];
    referenceYear?: number;
    periodDates?: (Date | string | null | undefined)[];
    financeYears?: number[];
  };

export const buildTestActiveStructureIdsByPeriod = (
  structureIds: number[],
  options: BuildTestActiveStructureIdsByPeriodOptions = {}
): StatistiquesContext["activeStructureIdsByPeriod"] => {
  const activityContext = buildTestActivityContext(structureIds, options);
  const activeStructureIdsByPeriod = createEmptyActiveStructureIdsByPeriod();

  buildActivityIndex(activityContext, activeStructureIdsByPeriod, {
    typologieYears: options.typologieYears ?? [2023, 2024, 2025, 2026],
    referenceYear: options.referenceYear ?? 2026,
    periodDates: options.periodDates ?? [],
    financeYears: options.financeYears,
  });

  return activeStructureIdsByPeriod;
};

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
        | "activeStructureIdsByPeriod"
        | "eigs"
        | "evaluations"
        | "budgets"
        | "indicateurs"
        | "activites"
      >
    >
): StatistiquesContext => {
  const structures = partial.structures;
  const allStructures = partial.allStructures ?? structures;
  const allStructureIds = allStructures.map((structure) => structure.id);

  const activeStructureIdsByPeriod =
    partial.activeStructureIdsByPeriod ??
    (() => {
      const index = createEmptyActiveStructureIdsByPeriod();
      buildActivityIndex(buildTestActivityContext(allStructureIds), index, {
        typologieYears: getTypologieYears(partial.typologies),
        referenceYear: 2026,
        periodDates: [],
      });
      return index;
    })();

  return {
    structures,
    allStructures,
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
  };
};
