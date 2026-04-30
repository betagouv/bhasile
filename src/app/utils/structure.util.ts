import dayjs from "dayjs";

import { CURRENT_YEAR } from "@/constants";
import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { ControleApiType } from "@/schemas/api/controle.schema";
import {
  CpomStructureApiRead,
  CpomStructureApiWrite,
} from "@/schemas/api/cpom.schema";
import { EvaluationApiType } from "@/schemas/api/evaluation.schema";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { IndicateurFinancierType } from "@/types/indicateur-financier.type";
import { StructureType } from "@/types/structure.type";

import { getDepartementFromCodePostal } from "./adresse.util";
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

export function getCommunesGroupedByDepartement(structure: {
  communeAdministrative?: string | null;
  departementAdministratif?: string | null;
  adresses?: { commune?: string | null; codePostal?: string | null }[];
}): { departement: string; communes: string[] }[] {
  const communesByDepartement = new Map<string, string[]>();

  const {
    communeAdministrative,
    departementAdministratif,
    adresses = [],
  } = structure;
  if (departementAdministratif && communeAdministrative?.trim()) {
    communesByDepartement.set(departementAdministratif, [
      communeAdministrative.trim(),
    ]);
  }
  for (const adresse of adresses) {
    const departement = getDepartementFromCodePostal(adresse.codePostal ?? "");
    const commune = adresse.commune?.trim();
    if (!departement || !commune) {
      continue;
    }
    const communesList = communesByDepartement.get(departement) ?? [];
    if (!communesList.includes(commune)) {
      communesList.push(commune);
    }
    communesByDepartement.set(departement, communesList);
  }
  if (
    departementAdministratif &&
    communesByDepartement.has(departementAdministratif)
  ) {
    const communesList = communesByDepartement.get(departementAdministratif)!;
    const administrativeCommune = communeAdministrative?.trim();
    if (administrativeCommune && communesList[0] !== administrativeCommune) {
      communesByDepartement.set(departementAdministratif, [
        administrativeCommune,
        ...communesList.filter((commune) => commune !== administrativeCommune),
      ]);
    }
  }
  const administrativeDepartement = departementAdministratif ?? "";
  const otherDepartements = [...communesByDepartement.keys()]
    .filter((departement) => departement !== administrativeDepartement)
    .sort();
  return (
    administrativeDepartement
      ? [administrativeDepartement, ...otherDepartements]
      : otherDepartements
  ).map((departement) => ({
    departement,
    communes: communesByDepartement.get(departement)!,
  }));
}

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

export const isStructureAutorisee = (
  type: StructureType | string | undefined | null
): boolean => {
  return type === StructureType.CADA || type === StructureType.CPH;
};

export const isStructureSubventionnee = (
  type: StructureType | string | undefined | null
): boolean => {
  return type === StructureType.HUDA || type === StructureType.CAES;
};

export const isStructureMultiAntenne = (
  structure: StructureApiRead
): boolean => {
  return (structure.antennes?.length ?? 0) > 0;
};

export const isStructureMultiDna = (structure: StructureApiRead): boolean => {
  return (
    (structure.dnaStructures?.length ?? 0) > 1 ||
    (structure.finesses?.length ?? 0) > 1
  );
};

export const getCurrentCpomStructure = (
  structure: StructureApiRead
): CpomStructureApiRead | undefined => {
  return structure.cpomStructures?.find((cpomStructure) => {
    const dateStart = cpomStructure.dateStart ?? cpomStructure.cpom?.dateStart;
    const dateEnd = cpomStructure.dateEnd ?? cpomStructure.cpom?.dateEnd;

    if (!dateStart || !dateEnd) {
      return false;
    }
    const now = new Date().toISOString();
    return dateStart <= now && dateEnd >= now;
  });
};

export const getCurrentCpomStructureDates = (
  structure: StructureApiRead
): { dateStart?: string; dateEnd?: string } => {
  const currentCpomStructure = getCurrentCpomStructure(structure);
  if (!currentCpomStructure) {
    return {};
  }

  const currentCpomStructureDateStart =
    currentCpomStructure.dateStart ?? currentCpomStructure.cpom?.dateStart;
  const currentCpomStructureDateEnd =
    currentCpomStructure.dateEnd ?? currentCpomStructure.cpom?.dateEnd;

  return {
    dateStart: currentCpomStructureDateStart ?? undefined,
    dateEnd: currentCpomStructureDateEnd ?? undefined,
  };
};

export const getMillesimeIndexForAYear = (
  typologies?:
    | StructureTypologieApiType[]
    | StructureMillesimeApiType[]
    | BudgetApiType[],
  year: number = CURRENT_YEAR,
  type?: StructureType | IndicateurFinancierType
): number =>
  typologies?.findIndex((typology) => {
    if (type) {
      return (
        typology.year === year &&
        ((typology as BudgetApiType).cpomStructureType === type ||
          (typology as IndicateurFinancierApiType).type === type)
      );
    }
    return typology.year === year;
  }) ?? -1;

export const getCpomStructureIndexAndBudgetIndexForAYearAndAType = (
  cpomStructures: CpomStructureApiRead[] | CpomStructureApiWrite[],
  year: number = CURRENT_YEAR,
  type?: StructureType
): { cpomStructureIndex: number; budgetIndex: number } => {
  if (!type) {
    return { cpomStructureIndex: -1, budgetIndex: -1 };
  }
  let budgetIndex = -1;
  const cpomStructureIndex = cpomStructures.findIndex((cpomStructure) => {
    budgetIndex =
      cpomStructure.cpom?.budgets?.findIndex(
        (budget) => budget.year === year && budget.cpomStructureType === type
      ) ?? -1;
    if (budgetIndex !== -1) {
      return true;
    }
    return false;
  });

  return { cpomStructureIndex, budgetIndex };
};

export const getRealCreationYear = (structure: StructureApiRead): number => {
  return structure.date303
    ? getYearFromDate(structure.date303)
    : getYearFromDate(structure.creationDate);
};
