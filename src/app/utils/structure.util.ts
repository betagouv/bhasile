import dayjs from "dayjs";

import { CURRENT_YEAR } from "@/constants";
import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { ControleApiType } from "@/schemas/api/controle.schema";
import { EvaluationApiType } from "@/schemas/api/evaluation.schema";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { CpomMillesime, CpomStructure } from "@/types/cpom.type";
import { Structure } from "@/types/structure.type";

import { sortKeysByValue } from "./common.util";
import { getYearFromDate } from "./date.util";

export const getPlacesByCommunes = (
  adresses: AdresseApiType[]
): Record<string, number> => {
  const placesByCommune: Record<string, number> = {};
  for (const adresse of adresses) {
    const existingCommune = Object.keys(placesByCommune).find(
      (commune) => commune === adresse.commune
    );

    if (!existingCommune) {
      placesByCommune[adresse.commune ?? ""] =
        adresse.adresseTypologies?.[0]?.placesAutorisees || 0;
    } else {
      placesByCommune[adresse.commune ?? ""] +=
        adresse.adresseTypologies?.[0]?.placesAutorisees || 0;
    }
  }

  return sortKeysByValue(placesByCommune);
};

export const getLastVisitInMonths = (
  evaluations: EvaluationApiType[],
  controles: ControleApiType[]
): number => {
  let mostRecentVisit = null;
  if (evaluations.length === 0 && controles.length === 0) {
    return 0;
  } else if (evaluations.length === 0) {
    mostRecentVisit = dayjs(controles[0]?.date);
  } else if (controles.length === 0) {
    mostRecentVisit = dayjs(evaluations[0]?.date);
  } else {
    mostRecentVisit = dayjs(evaluations[0]?.date).isBefore(
      dayjs(controles[0]?.date)
    )
      ? dayjs(controles[0]?.date)
      : dayjs(evaluations[0]?.date);
  }
  return dayjs().diff(mostRecentVisit, "month");
};

export const getOperateurLabel = (
  filiale: string | null | undefined,
  operateur: string | null | undefined
): string | null | undefined => {
  return filiale ? `${filiale} (${operateur})` : operateur;
};

export const getMillesimeIndexForAYear = (
  typologies?:
    | StructureTypologieApiType[]
    | StructureMillesimeApiType[]
    | BudgetApiType[]
    | CpomMillesime[],
  year: number = CURRENT_YEAR
): number => typologies?.findIndex((typology) => typology.year === year) ?? -1;

export const getCpomStructureIndexAndCpomMillesimeIndexForAYear = (
  cpomStructures: CpomStructure[],
  year: number = CURRENT_YEAR
): { cpomStructureIndex: number; cpomMillesimeIndex: number } => {
  let cpomMillesimeIndex = -1;
  const cpomStructureIndex = cpomStructures.findIndex((cpomStructure) => {
    cpomMillesimeIndex =
      cpomStructure.cpom?.cpomMillesimes?.findIndex(
        (cpomMillesime) => cpomMillesime.year === year
      ) ?? -1;
    if (cpomMillesimeIndex !== -1) {
      return true;
    }
    return false;
  });

  return { cpomStructureIndex, cpomMillesimeIndex };
};

export const getRealCreationYear = (structure: Structure): number => {
  return structure.date303
    ? getYearFromDate(structure.date303)
    : getYearFromDate(structure.creationDate);
};
