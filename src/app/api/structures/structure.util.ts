import { getDatesOfCurrentActeAdministratif } from "@/app/api/actes-administratifs/acte-administratif.util";
import { getDatesConvention as getCpomDatesConvention } from "@/app/api/cpoms/cpom.util";
import { getCoordinates } from "@/app/utils/adresse.util";
import {
  getYearFromDate,
  getYearRange,
  recursivelySerializeDates,
} from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";
import {
  Prisma,
  PublicType,
  StructureVersionTransformationType,
} from "@/generated/prisma/client";
import { AdresseTypologieApiType } from "@/schemas/api/adresse.schema";
import { CpomStructureApiRead } from "@/schemas/api/cpom.schema";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { Repartition } from "@/types/adresse.type";
import { StructureColumn } from "@/types/ListColumn";
import {
  CpomRef,
  HistoryEvent,
  StructureRef,
} from "@/types/structure-history.type";

import {
  StructureVersionDbDetails,
  StructureVersionDbTransformation,
} from "../structure-versions/structure-version.db.type";
import { getValidVersions } from "../structure-versions/structure-version.service";
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

type StructureQueryFilters = {
  search: string | null;
  type: string | null;
  bati: string | null;
  placesAutorisees: string | null;
  departements: string | null;
  operateurs: string | null;
  selection?: boolean;
  finalised?: boolean;
};

export const buildStructuresOrderSql = (
  column: StructureColumn,
  direction: "asc" | "desc"
): Prisma.Sql => {
  const dir = direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const byColumn: Record<StructureColumn, Prisma.Sql> = {
    codeBhasile: Prisma.sql`s."codeBhasile"`,
    type: Prisma.sql`sv."type"`,
    operateur: Prisma.sql`o."name"`,
    departementAdministratif: Prisma.sql`sv."departementAdministratif"`,
    bati: Prisma.sql`sr.bati`,
    communes: Prisma.sql`sv."communeAdministrative"`,
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
  finalised,
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
  if (finalised) {
    conditions.push(
      Prisma.sql`EXISTS (
        SELECT 1
        FROM public."Form" f
        JOIN public."FormDefinition" fd ON fd.id = f."formDefinitionId"
        WHERE f."structureId" = s.id
          AND fd."slug" = 'finalisation-v1'
          AND f."status" = true
      )`
    );
  }
  if (typeList.length > 0) {
    conditions.push(Prisma.sql`sv."type"::text IN (${Prisma.join(typeList)})`);
  }
  if (depList.length > 0) {
    conditions.push(
      Prisma.sql`sv."departementAdministratif" IN (${Prisma.join(depList)})`
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
        WHERE ds."structureVersionId" = sv.id
          AND d.code ILIKE ${like}
      )
      OR EXISTS (
        SELECT 1
        FROM public."StructureFiness" sf
        JOIN public."Finess" f ON f.id = sf."finessId"
        WHERE sf."structureVersionId" = sv.id
          AND COALESCE(f."code", '') ILIKE ${like}
      )
      OR COALESCE(sv."nom", '') ILIKE ${like}
      OR sv."departementAdministratif" ILIKE ${like}
      OR sv."communeAdministrative" ILIKE ${like}
      OR sv."codePostalAdministratif" ILIKE ${like}
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

export const getTypeBati = (
  structure:
    | StructureDbDetails
    | StructureDbList
    | StructureVersionDbTransformation
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

type SiblingTransformation = NonNullable<
  StructureVersionDbDetails["structureVersionTransformation"]
>["transformation"]["structureVersionTransformations"][number];

const PLACE_LOSER_TYPES: StructureVersionTransformationType[] = [
  StructureVersionTransformationType.CONTRACTION,
  StructureVersionTransformationType.FERMETURE,
];

const PLACE_GAINER_TYPES: StructureVersionTransformationType[] = [
  StructureVersionTransformationType.CREATION,
  StructureVersionTransformationType.EXTENSION,
];

const getCounterpartStructures = (
  siblings: SiblingTransformation[],
  ownTransformationId: number,
  counterpartTypes: StructureVersionTransformationType[]
): StructureRef[] =>
  siblings
    .filter(
      (sibling) =>
        sibling.id !== ownTransformationId &&
        counterpartTypes.includes(sibling.type)
    )
    .map((sibling) => sibling.structureVersion?.structure)
    .filter((structure): structure is StructureRef => structure != null);

const buildCreationEvent = (
  structure: StructureDbDetails,
  validVersions: StructureVersionDbDetails[]
): HistoryEvent | null => {
  const creationVersion = validVersions.find(
    (version) =>
      version.structureVersionTransformation?.type ===
      StructureVersionTransformationType.CREATION
  );

  if (creationVersion) {
    const { id: ownTransformationId, transformation } =
      creationVersion.structureVersionTransformation!;
    return {
      kind: "CREATION",
      date: creationVersion.effectiveDate.toISOString(),
      sources: getCounterpartStructures(
        transformation.structureVersionTransformations,
        ownTransformationId,
        PLACE_LOSER_TYPES
      ),
    };
  }

  const fallbackDate =
    structure.creationDate ??
    validVersions[validVersions.length - 1]?.effectiveDate;

  return fallbackDate
    ? { kind: "CREATION", date: fallbackDate.toISOString(), sources: [] }
    : null;
};

const buildTransformationEvent = (
  version: StructureVersionDbDetails
): HistoryEvent | null => {
  const structureVersionTransformation = version.structureVersionTransformation;
  if (!structureVersionTransformation) {
    return null;
  }

  const date = version.effectiveDate.toISOString();
  const {
    id: ownTransformationId,
    motif,
    transformation,
    type,
  } = structureVersionTransformation;
  const siblings = transformation.structureVersionTransformations;

  switch (type) {
    case StructureVersionTransformationType.EXTENSION:
      return {
        kind: "EXTENSION",
        date,
        sources: getCounterpartStructures(
          siblings,
          ownTransformationId,
          PLACE_LOSER_TYPES
        ),
      };
    case StructureVersionTransformationType.CONTRACTION:
      return {
        kind: "CONTRACTION",
        date,
        targets: getCounterpartStructures(
          siblings,
          ownTransformationId,
          PLACE_GAINER_TYPES
        ),
      };
    case StructureVersionTransformationType.FERMETURE:
      return {
        kind: "FERMETURE",
        date,
        targets: getCounterpartStructures(
          siblings,
          ownTransformationId,
          PLACE_GAINER_TYPES
        ),
        motif,
      };
    default:
      return null;
  }
};

const buildCpomEvents = (
  cpomStructures: CpomStructureApiRead[]
): HistoryEvent[] => {
  const now = new Date().toISOString();
  const events: HistoryEvent[] = [];

  cpomStructures.forEach((cpomStructure) => {
    const { cpom } = cpomStructure;
    if (!cpom || cpom.id === undefined) {
      return;
    }

    const entryDate = cpomStructure.dateStart ?? cpom.dateStart;
    const exitDate = cpomStructure.dateEnd ?? cpom.dateEnd;

    const cpomRef: CpomRef = {
      id: cpom.id,
      operateurName: cpom.operateur?.name ?? "",
      departements:
        cpom.departements
          ?.map((cpomDepartement) => cpomDepartement.departement?.numero)
          .filter((numero): numero is string => Boolean(numero)) ?? [],
    };

    if (entryDate && entryDate <= now) {
      events.push({ kind: "CPOM_ENTRY", date: entryDate, cpom: cpomRef });
    }
    if (exitDate && exitDate <= now) {
      events.push({ kind: "CPOM_EXIT", date: exitDate, cpom: cpomRef });
    }
  });

  return events;
};

export const buildStructureHistory = (
  structure: StructureDbDetails,
  cpomStructures: CpomStructureApiRead[]
): HistoryEvent[] => {
  const validVersions = getValidVersions(
    structure.structureVersions ?? [],
    new Date()
  );

  const events = [
    buildCreationEvent(structure, validVersions),
    ...validVersions.map(buildTransformationEvent),
    ...buildCpomEvents(cpomStructures),
  ].filter((event): event is HistoryEvent => event !== null);

  return events.sort((first, second) => {
    if (first.date === second.date) {
      return 0;
    }
    return first.date < second.date ? 1 : -1;
  });
};
