import { INDICATEUR_FINANCIER_CUTOFF_YEAR } from "@/constants";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { IndicateurFinancierFormValues } from "@/schemas/forms/base/indicateurFinancier.schema";

import { isNullOrUndefined } from "./common.util";
import { getYearRange } from "./date.util";

export const getIndicateursFinanciersDefaultValues = (
  structureIndicateursFinanciers: IndicateurFinancierApiType[],
  structureCreationYear?: number
): IndicateurFinancierFormValues[] => {
  const { years } = getYearRange();
  const yearsToDisplay = structureCreationYear
    ? years.filter((year) => year >= structureCreationYear)
    : years;

  const columns = yearsToDisplay.flatMap((year) => {
    if (year >= INDICATEUR_FINANCIER_CUTOFF_YEAR) {
      return [
        {
          year,
          type: "PREVISIONNEL",
        },
        {
          year,
          type: "REALISE",
        },
      ];
    }

    return [
      {
        year,
        type: "REALISE",
      },
    ];
  });

  const indicateursFinanciers = columns.map((emptyIndicateurFinancier) => {
    const indicateurFinancier = structureIndicateursFinanciers.find(
      (indicateurFinancier) => {
        return (
          indicateurFinancier.year === emptyIndicateurFinancier.year &&
          indicateurFinancier.type === emptyIndicateurFinancier.type
        );
      }
    );
    if (indicateurFinancier) {
      return {
        ...indicateurFinancier,
        year: indicateurFinancier.year,
        type: indicateurFinancier.type,
        ETP: indicateurFinancier.ETP ?? undefined,
        tauxEncadrement: indicateurFinancier.tauxEncadrement ?? undefined,
        coutJournalier: indicateurFinancier.coutJournalier ?? undefined,
      };
    }
    return emptyIndicateurFinancier;
  }) as IndicateurFinancierFormValues[];

  return indicateursFinanciers;
};

export const isYearRealisee = (
  indicateursFinanciers: IndicateurFinancierApiType[],
  year: number
) => {
  const indicateurFinancierRealise = indicateursFinanciers.find(
    (indicateurFinancier) =>
      indicateurFinancier.year === year &&
      indicateurFinancier.type === "REALISE"
  );

  return (
    !isNullOrUndefined(indicateurFinancierRealise?.ETP) &&
    !isNullOrUndefined(indicateurFinancierRealise?.tauxEncadrement) &&
    !isNullOrUndefined(indicateurFinancierRealise?.coutJournalier)
  );
};
