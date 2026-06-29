import type { StatistiquesContext } from "@/app/api/statistiques/statistiques.db.type";
import { buildStatistiquesActivityContext } from "@/app/api/statistiques/statistiques.utils";

type BuildTestActivityContextOptions = {
  openingDate?: Date;
  closureDates?: Map<number, Date | null>;
};

export const buildTestActivityContext = (
  structureIds: number[],
  options: BuildTestActivityContextOptions = {}
): StatistiquesContext["activityContext"] => {
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

export const buildTestStatistiquesContext = (
  partial: Pick<
    StatistiquesContext,
    "structures" | "typologies" | "adresses" | "departements"
  > &
    Partial<
      Pick<
        StatistiquesContext,
        "cpomLinks" | "dnaLinks" | "dnaCodes" | "allStructures" | "activityContext"
      >
    >
): StatistiquesContext => {
  const structures = partial.structures;
  const allStructures = partial.allStructures ?? structures;
  const allStructureIds = allStructures.map((structure) => structure.id);

  return {
    structures,
    allStructures,
    activityContext:
      partial.activityContext ?? buildTestActivityContext(allStructureIds),
    typologies: partial.typologies,
    adresses: partial.adresses,
    departements: partial.departements,
    cpomLinks: partial.cpomLinks ?? [],
    dnaLinks: partial.dnaLinks ?? [],
    dnaCodes: partial.dnaCodes ?? [],
  };
};
