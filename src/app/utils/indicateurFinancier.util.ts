import {
  CURRENT_YEAR,
  INDICATEUR_FINANCIER_PREVISIONNEL_START_YEAR,
} from "@/constants";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { IndicateurFinancierFormValues } from "@/schemas/forms/base/indicateurFinancier.schema";
import { IndicateurFinancierType } from "@/types/indicateur-financier.type";

import { isNullOrUndefined } from "./common.util";
import { getYearRange } from "./date.util";

export const getIndicateurFinancierTypes = (
  year: number
): IndicateurFinancierType[] => {
  if (year >= CURRENT_YEAR) {
    return ["PREVISIONNEL"];
  }
  if (year >= INDICATEUR_FINANCIER_PREVISIONNEL_START_YEAR) {
    return ["PREVISIONNEL", "REALISE"];
  }
  return ["REALISE"];
};

export const getIndicateursFinanciersDefaultValues = (
  structureIndicateursFinanciers: IndicateurFinancierApiType[],
  structureCreationYear?: number
): IndicateurFinancierFormValues[] => {
  const { years } = getYearRange();
  const yearsToDisplay = structureCreationYear
    ? years.filter((year) => year >= structureCreationYear)
    : years;

  const columns = yearsToDisplay.flatMap((year) =>
    getIndicateurFinancierTypes(year).map((type) => ({ year, type }))
  );

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

const isYearTypeFilled = (
  indicateursFinanciers: IndicateurFinancierApiType[],
  year: number,
  type: "REALISE" | "PREVISIONNEL"
) => {
  const indicateurFinancier = indicateursFinanciers.find(
    (indicateurFinancier) =>
      indicateurFinancier.year === year && indicateurFinancier.type === type
  );

  return (
    !isNullOrUndefined(indicateurFinancier?.ETP) &&
    !isNullOrUndefined(indicateurFinancier?.tauxEncadrement) &&
    !isNullOrUndefined(indicateurFinancier?.coutJournalier)
  );
};

export const isYearRealisee = (
  indicateursFinanciers: IndicateurFinancierApiType[],
  year: number
) =>
  year < CURRENT_YEAR &&
  isYearTypeFilled(indicateursFinanciers, year, "REALISE");

export const isYearPrevisionnelle = (
  indicateursFinanciers: IndicateurFinancierApiType[],
  year: number
) => isYearTypeFilled(indicateursFinanciers, year, "PREVISIONNEL");

export const getEveryColumn = (
  canEdit: boolean,
  indicateursFinanciers: IndicateurFinancierApiType[],
  years: number[]
): IndicateurFinancierType[][] =>
  years.map((year) => {
    if (canEdit || year >= CURRENT_YEAR) {
      return getIndicateurFinancierTypes(year);
    }
    return [
      isYearRealisee(indicateursFinanciers, year) ? "REALISE" : "PREVISIONNEL",
    ];
  });
