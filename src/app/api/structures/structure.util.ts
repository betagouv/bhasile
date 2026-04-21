import { getCoordinates } from "@/app/utils/adresse.util";
import { computeCpomDates } from "@/app/utils/cpom.util";
import {
  getYearFromDate,
  getYearRange,
  serializeDates,
} from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";
import { Prisma, PublicType, StructureType } from "@/generated/prisma/client";
import { AdresseTypologieApiType } from "@/schemas/api/adresse.schema";
import {
  StructureApiRead,
  StructureApiWrite,
} from "@/schemas/api/structure.schema";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { Repartition } from "@/types/adresse.type";
import { StructureColumn } from "@/types/ListColumn";

const typesPublic: Record<string, PublicType> = {
  "tout public": PublicType.TOUT_PUBLIC,
  famille: PublicType.FAMILLE,
  "personnes isolées": PublicType.PERSONNES_ISOLEES,
};

export const dbStructureToApiWrite = (
  structure: unknown
): StructureApiWrite => {
  return serializeDates(structure) as StructureApiWrite;
};

export const convertToPublicType = (
  typePublic: string | null | undefined
): PublicType | undefined => {
  if (!typePublic) {
    return undefined;
  }

  return typesPublic[typePublic.trim().toLowerCase()];
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

type StructureQueryFilters = {
  search: string | null;
  type: string | null;
  bati: string | null;
  placesAutorisees: string | null;
  departements: string | null;
  operateurs: string | null;
  selection?: boolean;
};

export const buildStructuresOrderSql = (
  column: StructureColumn,
  direction: "asc" | "desc"
): Prisma.Sql => {
  const dir = direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const byColumn: Record<StructureColumn, Prisma.Sql> = {
    codeBhasile: Prisma.sql`s."codeBhasile"`,
    type: Prisma.sql`s."type"`,
    operateur: Prisma.sql`o."name"`,
    departementAdministratif: Prisma.sql`s."departementAdministratif"`,
    bati: Prisma.sql`sr.bati`,
    communes: Prisma.sql`s."communeAdministrative"`,
    placesAutorisees: Prisma.sql`st."placesAutorisees"`,
    finConvention: Prisma.sql`s."finConvention"`,
  };
  return Prisma.sql`${byColumn[column]} ${dir}, s."codeBhasile" ASC`;
};

export const buildStructuresWhereSql = ({
  search,
  type,
  bati,
  departements,
  placesAutorisees,
  operateurs,
  selection,
}: StructureQueryFilters): Prisma.Sql => {
  const conditions: Prisma.Sql[] = [];
  const typeList = type?.split(",").filter(Boolean) ?? [];
  const depList = departements?.split(",").filter(Boolean) ?? [];
  const opList = operateurs?.split(",").filter(Boolean) ?? [];

  if (!selection) {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM public."Form" f WHERE f."structureId" = s.id)`
    );
  }
  if (typeList.length > 0) {
    conditions.push(Prisma.sql`s."type"::text IN (${Prisma.join(typeList)})`);
  }
  if (depList.length > 0) {
    conditions.push(
      Prisma.sql`s."departementAdministratif" IN (${Prisma.join(depList)})`
    );
  }
  if (opList.length > 0) {
    conditions.push(Prisma.sql`o."name" IN (${Prisma.join(opList)})`);
  }
  if (placesAutorisees) {
    const [minStr, maxStr] = placesAutorisees.split(",");
    const min = minStr ? parseInt(minStr, 10) : null;
    const max = maxStr ? parseInt(maxStr, 10) : null;
    if (
      min !== null &&
      max !== null &&
      !Number.isNaN(min) &&
      !Number.isNaN(max)
    ) {
      conditions.push(
        Prisma.sql`st."placesAutorisees" >= ${min} AND st."placesAutorisees" <= ${max}`
      );
    }
  }

  if (search) {
    const like = `%${search}%`;
    conditions.push(Prisma.sql`(
      s."codeBhasile" ILIKE ${like}
      OR EXISTS (
        SELECT 1
        FROM public."DnaStructure" ds
        JOIN public."Dna" d ON d.id = ds."dnaId"
        WHERE ds."structureId" = s.id
          AND d.code ILIKE ${like}
      )
      OR EXISTS (
        SELECT 1
        FROM public."Finess" f
        WHERE f."structureId" = s.id
          AND COALESCE(f."code", '') ILIKE ${like}
      )
      OR COALESCE(s."nom", '') ILIKE ${like}
      OR s."departementAdministratif" ILIKE ${like}
      OR s."communeAdministrative" ILIKE ${like}
      OR s."codePostalAdministratif" ILIKE ${like}
      OR COALESCE(o."name", '') ILIKE ${like}
    )`);
  }
  if (bati) {
    const batiList = bati
      .split(",")
      .filter(Boolean)
      .map((value) => value.toUpperCase());
    if (batiList.length > 0) {
      conditions.push(
        Prisma.sql`UPPER(COALESCE(sr.bati, '')) IN (${Prisma.join(batiList)})`
      );
    }
  }

  if (conditions.length === 0) {
    return Prisma.sql``;
  }
  let combined = conditions[0];
  for (let i = 1; i < conditions.length; i += 1) {
    combined = Prisma.sql`${combined} AND ${conditions[i]}`;
  }
  return Prisma.sql`WHERE ${combined}`;
};

export const getRepartition = (structure: StructureApiWrite): Repartition => {
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
  }
  if (isDiffus) {
    return Repartition.DIFFUS;
  }
  return Repartition.COLLECTIF;
};

const getCurrentPlacesByProperty = (
  structure: StructureApiWrite,
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

export const getCurrentPlacesAutorisees = (structure: StructureApiWrite) =>
  getCurrentPlacesByProperty(structure, "placesAutorisees");

export const getCurrentPlacesQpv = (structure: StructureApiWrite) =>
  getCurrentPlacesByProperty(structure, "qpv");

export const getCurrentPlacesLogementsSociaux = (
  structure: StructureApiWrite
) => getCurrentPlacesByProperty(structure, "logementSocial");

export const isStructureInCpom = (
  structure: StructureApiWrite | StructureApiRead,
  year: number = CURRENT_YEAR
): boolean =>
  structure.cpomStructures?.some((cpomStructure) => {
    const dateStart =
      cpomStructure.dateStart ?? computeCpomDates(cpomStructure.cpom).dateStart;
    const dateEnd =
      cpomStructure.dateEnd ?? computeCpomDates(cpomStructure.cpom).dateEnd;

    if (!dateStart || !dateEnd) {
      return false;
    }

    const yearStart = getYearFromDate(dateStart);
    const yearEnd = getYearFromDate(dateEnd);
    return yearStart <= year && yearEnd >= year;
  }) ?? false;

export const isStructureInCpomPerYear = (
  structure: StructureApiWrite
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
