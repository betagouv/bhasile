import { getDatesOfCurrentActeAdministratif } from "@/app/api/actes-administratifs/acte-administratif.util";
import { getDatesConvention as getCpomDatesConvention } from "@/app/api/cpoms/cpom.util";
import { getCoordinates } from "@/app/utils/adresse.util";
import {
  getYearFromDate,
  getYearRange,
  recursivelySerializeDates,
} from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";
import { PublicType } from "@/generated/prisma/client";
import { AdresseTypologieApiType } from "@/schemas/api/adresse.schema";
import { CpomStructureApiRead } from "@/schemas/api/cpom.schema";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { Repartition } from "@/types/adresse.type";

import { StructureVersionDbTransformation } from "../structure-versions/structure-version.db.type";
import { StructureDbDetails, StructureDbList } from "./structure.db.type";

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

export const getOperateurLabel = (
  structure: StructureDbDetails | StructureDbList
): string => {
  const { operateur } = structure;
  if (!operateur) {
    return "";
  }
  if (operateur.parentId) {
    const parentName = operateur.parent!.name;
    return `${operateur.name} (${parentName})`;
  }
  return operateur.name;
};

export const getAdresseAdministrativeCoordinates = async (
  structure: StructureAgentUpdateApiType
): Promise<{ latitude: string | undefined; longitude: string | undefined }> => {
  const {
    adresseAdministrative,
    codePostalAdministratif,
    communeAdministrative,
  } = structure;
  if (
    !adresseAdministrative ||
    !codePostalAdministratif ||
    !communeAdministrative
  ) {
    return { latitude: undefined, longitude: undefined };
  }
  const fullAddress = `${adresseAdministrative}, ${codePostalAdministratif} ${communeAdministrative}`;
  const coordinates = await getCoordinates(fullAddress);
  return {
    latitude: coordinates.latitude?.toString(),
    longitude: coordinates.longitude?.toString(),
  };
};

export const getTypeBati = (
  structure: StructureDbDetails | StructureDbList | StructureVersionDbTransformation
): Repartition | undefined => {
  const repartitions = structure.adresses?.map(
    (adresse) => adresse.repartition
  );
  const isDiffus = repartitions?.some(
    (repartition) => repartition === Repartition.DIFFUS
  );
  const isCollectif = repartitions?.some(
    (repartition) => repartition === Repartition.COLLECTIF
  );

  if (isDiffus && isCollectif) {
    return Repartition.MIXTE;
  }
  if (isDiffus) {
    return Repartition.DIFFUS;
  }
  if (isCollectif) {
    return Repartition.COLLECTIF;
  }
  return undefined;
};

export const getDatesConvention = (
  structure: StructureDbDetails | StructureDbList
): [Date | null, Date | null] =>
  getDatesOfCurrentActeAdministratif(
    structure.actesAdministratifs,
    "CONVENTION"
  );

export const getDatesPeriodeAutorisation = (
  structure: StructureDbDetails | StructureDbList
): [Date | null, Date | null] =>
  getDatesOfCurrentActeAdministratif(
    structure.actesAdministratifs,
    "ARRETE_AUTORISATION"
  );

const getCurrentPlacesByProperty = (
  structure: StructureDbDetails | StructureDbList,
  accessor: keyof AdresseTypologieApiType
): number => {
  const mostRecentYearTypologies = structure.adresses?.map(
    (adresse) => adresse.adresseTypologies?.[0]
  );
  const placesByAccessor = mostRecentYearTypologies?.reduce(
    (totalCount, currentTypologie) =>
      totalCount + ((currentTypologie?.[accessor] as number) || 0),
    0
  );

  return placesByAccessor || 0;
};

export const getCurrentPlacesAutorisees = (
  structure: StructureDbDetails | StructureDbList
) => getCurrentPlacesByProperty(structure, "placesAutorisees");

export const getCurrentPlacesQpv = (
  structure: StructureDbDetails | StructureDbList
) => getCurrentPlacesByProperty(structure, "qpv");

export const getCurrentPlacesLogementsSociaux = (
  structure: StructureDbDetails | StructureDbList
) => getCurrentPlacesByProperty(structure, "logementSocial");

export const isStructureInCpom = (
  structure: StructureDbDetails | StructureDbList,
  year: number = CURRENT_YEAR
): boolean =>
  structure.cpomStructures?.some((cpomStructure) => {
    const [cpomDateStart, cpomDateEnd] = getCpomDatesConvention(
      cpomStructure.cpom
    );
    const dateStart = cpomStructure.dateStart ?? cpomDateStart;
    const dateEnd = cpomStructure.dateEnd ?? cpomDateEnd;

    if (!dateStart || !dateEnd) {
      return false;
    }

    const yearStart = getYearFromDate(dateStart);
    const yearEnd = getYearFromDate(dateEnd);
    return yearStart <= year && yearEnd >= year;
  }) ?? false;

export const isStructureInCpomPerYear = (
  structure: StructureDbDetails | StructureDbList
): Record<number, boolean> => {
  const { years } = getYearRange({ order: "desc" });
  const realCreationYear = structure.date303
    ? getYearFromDate(structure.date303)
    : getYearFromDate(structure.creationDate);
  const yearsSinceCreation = years.filter((year) => year >= realCreationYear);
  return yearsSinceCreation.reduce(
    (acc, year) => ({ ...acc, [year]: isStructureInCpom(structure, year) }),
    {} as Record<number, boolean>
  );
};

export const getCpomStructuresWithDates = (
  structure: StructureDbDetails | StructureDbList
): CpomStructureApiRead[] | undefined => {
  const cpomStructures = structure.cpomStructures?.map((cpomStructure) => {
    const [cpomDateStart, cpomDateEnd] = getCpomDatesConvention(
      cpomStructure.cpom
    );

    return recursivelySerializeDates({
      ...cpomStructure,
      cpom: cpomStructure.cpom
        ? {
            ...cpomStructure.cpom,
            dateStart: cpomDateStart,
            dateEnd: cpomDateEnd,
            granularity: cpomStructure.cpom.granularity,
            actesAdministratifs:
              cpomStructure.cpom.actesAdministratifs?.map(
                (acteAdministratif) => ({
                  ...acteAdministratif,
                  startDate: acteAdministratif.startDate ?? undefined,
                  endDate: acteAdministratif.endDate ?? undefined,
                  date: acteAdministratif.date ?? undefined,
                })
              ) ?? [],
          }
        : cpomStructure.cpom,
    }) as CpomStructureApiRead;
  });
  return cpomStructures;
};
