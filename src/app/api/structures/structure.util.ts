import { computeCpomDates } from "@/app/api/cpoms/cpom.util";
import { formatDateToIsoString, getYearFromDate } from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";
import { PublicType, StructureType } from "@/generated/prisma/client";
import { ActiviteApiType } from "@/schemas/api/activite.schema";
import { AdresseTypologieApiType } from "@/schemas/api/adresse.schema";
import { Repartition } from "@/types/adresse.type";
import { CpomStructure } from "@/types/cpom.type";

import { computeCpom } from "../cpoms/cpom.service";
import { StructureWithRelations } from "./structure.type";

const typesPublic: Record<string, PublicType> = {
  "tout public": PublicType.TOUT_PUBLIC,
  famille: PublicType.FAMILLE,
  "personnes isolées": PublicType.PERSONNES_ISOLEES,
};
export const convertToPublicType = (
  typePublic: string | null | undefined
): PublicType | undefined => {
  if (!typePublic) {
    return undefined;
  }

  return typesPublic[typePublic.trim().toLowerCase()];
};

export const addPresencesIndues = (
  structure: StructureWithRelations
): ActiviteApiType[] => {
  return structure.activites.map((activite) => {
    const presencesIndues =
      (activite?.presencesInduesBPI || 0) +
      (activite?.presencesInduesDeboutees || 0);
    return {
      ...activite,
      date: formatDateToIsoString(activite.date) ?? "",
      placesAutorisees: activite.placesAutorisees ?? 0,
      presencesIndues,
    };
  });
};

export const convertToStructureType = (
  structureType: string
): StructureType => {
  const typesStructures: Record<string, StructureType> = {
    CADA: StructureType.CADA,
    HUDA: StructureType.HUDA,
    CPH: StructureType.CPH,
    CAES: StructureType.CAES,
    PRAHDA: StructureType.PRAHDA,
  };
  return typesStructures[structureType.trim()];
};

export const getRepartition = (
  structure: StructureWithRelations
): Repartition => {
  const repartitions = structure.adresses?.map(
    (adresse) => adresse.repartition
  );

  const isDiffus = repartitions?.some(
    (repartition) =>
      repartition?.toUpperCase() === Repartition.DIFFUS.toUpperCase()
  );
  const isCollectif = repartitions?.some(
    (repartition) =>
      repartition?.toUpperCase() === Repartition.COLLECTIF.toUpperCase()
  );
  if (isDiffus && isCollectif) {
    return Repartition.MIXTE;
  } else if (isDiffus) {
    return Repartition.DIFFUS;
  } else {
    return Repartition.COLLECTIF;
  }
};

const getCurrentPlacesByProperty = (
  structure: StructureWithRelations,
  accessor: keyof AdresseTypologieApiType
) => {
  const mostRecentYearTypologies = structure.adresses?.map(
    (adresse) => adresse.adresseTypologies.sort((a, b) => b.year - a.year)[0]
  );
  const placesByAccessor = mostRecentYearTypologies?.reduce(
    (totalCount, currentTypologie) =>
      totalCount + ((currentTypologie?.[accessor] as number) || 0),
    0
  );
  return placesByAccessor || 0;
};

export const getCurrentPlacesAutorisees = (
  structure: StructureWithRelations
): number => {
  return getCurrentPlacesByProperty(structure, "placesAutorisees");
};

export const getCurrentPlacesQpv = (
  structure: StructureWithRelations
): number => {
  return getCurrentPlacesByProperty(structure, "qpv");
};

export const getCurrentPlacesLogementsSociaux = (
  structure: StructureWithRelations
): number => {
  return getCurrentPlacesByProperty(structure, "logementSocial");
};

export const isStructureAutorisee = (type: string | undefined): boolean => {
  return type === StructureType.CADA || type === StructureType.CPH;
};

export const isStructureSubventionnee = (type: string | undefined): boolean => {
  return type === StructureType.HUDA || type === StructureType.CAES;
};

export const isStructureInCpom = (
  structure: StructureWithRelations,
  year: number = CURRENT_YEAR
): boolean => {
  return (
    structure.cpomStructures?.some((cpomStructure) => {
      const dateStart =
        cpomStructure.dateStart ??
        computeCpomDates(cpomStructure.cpom).dateStart;
      const dateEnd =
        cpomStructure.dateEnd ?? computeCpomDates(cpomStructure.cpom).dateEnd;

      if (!dateStart || !dateEnd) {
        return false;
      }

      const yearStart = getYearFromDate(dateStart);
      const yearEnd = getYearFromDate(dateEnd);

      return yearStart <= year && yearEnd >= year;
    }) ?? false
  );
};

export const wasStructureInCpom = (
  structure: StructureWithRelations,
  years: number[]
): boolean => {
  return years.some((year) => isStructureInCpom(structure, year));
};

export const getCurrentComputedCpomStructure = (
  structure: StructureWithRelations
): CpomStructure | undefined => {
  const dbCpomStructure = structure.cpomStructures?.find((cpomStructure) => {
    const dateStart =
      cpomStructure.dateStart ?? computeCpomDates(cpomStructure.cpom).dateStart;
    const dateEnd =
      cpomStructure.dateEnd ?? computeCpomDates(cpomStructure.cpom).dateEnd;

    if (!dateStart || !dateEnd) {
      return false;
    }

    const yearDebut = getYearFromDate(dateStart);
    const yearFin = getYearFromDate(dateEnd);

    return yearDebut <= CURRENT_YEAR && yearFin >= CURRENT_YEAR;
  });
  if (!dbCpomStructure) {
    return undefined;
  }

  const cpom = computeCpom(dbCpomStructure.cpom);

  return {
    ...dbCpomStructure,
    cpom,
    dateStart: dbCpomStructure.dateStart
      ? formatDateToIsoString(dbCpomStructure.dateStart)
      : dbCpomStructure.cpom?.dateStart
        ? formatDateToIsoString(dbCpomStructure.cpom.dateStart)
        : undefined,
    dateEnd: dbCpomStructure.dateEnd
      ? formatDateToIsoString(dbCpomStructure.dateEnd)
      : dbCpomStructure.cpom?.dateEnd
        ? formatDateToIsoString(dbCpomStructure.cpom.dateEnd)
        : undefined,
  };
};
