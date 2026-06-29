import type { StatistiquesContext } from "@/app/api/statistiques/statistiques.db.type";
import { buildStatistiquesYearContext } from "@/app/api/statistiques/statistiques.utils";

type BuildTestYearContextOptions = {
  years?: number[];
  openingDate?: Date;
  closureDates?: Map<number, Date | null>;
};

export const buildTestYearContext = (
  structureIds: number[],
  options: BuildTestYearContextOptions = {}
): StatistiquesContext["yearContext"] => {
  const openingDate = options.openingDate ?? new Date("2000-01-01T00:00:00.000Z");
  const closureDates =
    options.closureDates ??
    new Map(structureIds.map((structureId) => [structureId, null]));

  return buildStatistiquesYearContext(
    structureIds,
    options.years ?? [],
    new Map(structureIds.map((structureId) => [structureId, openingDate])),
    closureDates
  );
};

export const buildTestStatistiquesContext = (
  partial: Pick<
    StatistiquesContext,
    "structures" | "typologies" | "adresses" | "departements"
  > &
    Partial<
      Pick<
        StatistiquesContext,
        "cpomLinks" | "dnaLinks" | "dnaCodes" | "allStructures" | "yearContext"
      >
    >
): StatistiquesContext => {
  const structures = partial.structures;
  const allStructures = partial.allStructures ?? structures;
  const allStructureIds = allStructures.map((structure) => structure.id);

  return {
    structures,
    allStructures,
    yearContext:
      partial.yearContext ??
      buildTestYearContext(allStructureIds, {
        years: [...new Set(partial.typologies.map((typologie) => typologie.year))],
      }),
    typologies: partial.typologies,
    adresses: partial.adresses,
    departements: partial.departements,
    cpomLinks: partial.cpomLinks ?? [],
    dnaLinks: partial.dnaLinks ?? [],
    dnaCodes: partial.dnaCodes ?? [],
  };
};
