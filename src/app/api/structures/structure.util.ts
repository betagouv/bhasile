import {
  ActeAdministratifDates,
  getDatesOfCurrentActeAdministratif,
} from "@/app/api/actes-administratifs/acte-administratif.util";
import { getDatesConvention as getCpomDatesConvention } from "@/app/api/cpoms/cpom.util";
import { getCoordinates } from "@/app/utils/adresse.util";
import {
  getYearFromDate,
  getYearRange,
  recursivelySerializeDates,
  startOfNextUtcDay,
} from "@/app/utils/date.util";
import {
  type SortKind,
  sortRows,
  type SortValue,
} from "@/app/utils/list.util";
import { normalizeAccents, parseCommaList } from "@/app/utils/string.util";
import { CURRENT_YEAR } from "@/constants";
import {
  PublicType,
  StructureType,
  StructureVersionTransformationType,
} from "@/generated/prisma/client";
import { AdresseTypologieApiType } from "@/schemas/api/adresse.schema";
import { CpomStructureApiRead } from "@/schemas/api/cpom.schema";
import {
  StructureAgentUpdateApiType,
  StructureCampaignApiRead,
} from "@/schemas/api/structure.schema";
import { Repartition } from "@/types/adresse.type";
import { StructureColumn } from "@/types/ListColumn";
import {
  CpomRef,
  HistoryEvent,
  StructureRef,
} from "@/types/structure-history.type";
import { UpcomingTransformation } from "@/types/transformation.type";

import { FINALISATION_FORM_SLUG } from "../forms/form.constants";
import { StructureVersionDbDetails } from "../structure-versions/structure-version.db.type";
import {
  getValidVersions,
  isVersionValid,
  resolveCurrentVersionFields,
} from "../structure-versions/structure-version.util";
import {
  StructureDbDetails,
  StructureDbList,
  StructureListLight,
  StructureListLightVersion,
} from "./structure.db.type";
import type { SearchProps } from "./structure.service";

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

export const getTypeBati = (structure: {
  adresses?: { repartition: Repartition | null }[] | null;
}): Repartition | undefined => {
  const repartitions = (structure.adresses ?? [])
    .map((adresse) => adresse.repartition)
    .filter((repartition): repartition is Repartition => repartition !== null);

  if (repartitions.length === 0) {
    return undefined;
  }
  if (
    repartitions.every((repartition) => repartition === Repartition.COLLECTIF)
  ) {
    return Repartition.COLLECTIF;
  }
  if (repartitions.every((repartition) => repartition === Repartition.DIFFUS)) {
    return Repartition.DIFFUS;
  }
  return Repartition.MIXTE;
};

export const getDatesConvention = (structure: {
  actesAdministratifs: ActeAdministratifDates[];
}): [Date | null, Date | null] =>
  getDatesOfCurrentActeAdministratif(
    structure.actesAdministratifs,
    "CONVENTION"
  );

export const getDatesPeriodeAutorisation = (structure: {
  actesAdministratifs: ActeAdministratifDates[];
}): [Date | null, Date | null] =>
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

export const isFinalisationFormValidated = (
  forms:
    | { status: boolean; formDefinition: { slug: string } }[]
    | null
    | undefined
): boolean =>
  forms?.some(
    (form) => form.formDefinition.slug === FINALISATION_FORM_SLUG && form.status
  ) ?? false;

export const buildStructureCampaigns = (
  versions: {
    campaign?: {
      form: { status: boolean } | null;
      campaignDefinition: { slug: string } | null;
    } | null;
  }[]
): StructureCampaignApiRead[] =>
  versions.flatMap((version) => {
    const campaign = version.campaign;
    if (!campaign || !campaign.campaignDefinition) {
      return [];
    }
    return [
      {
        slug: campaign.campaignDefinition.slug,
        isValidated: campaign.form?.status === true,
      },
    ];
  });

export const isBornFromCreation = (
  versions:
    | {
        effectiveDate: Date | null;
        structureVersionTransformation?: {
          type: StructureVersionTransformationType;
          transformation?: { form?: { status: boolean } | null } | null;
        } | null;
      }[]
    | null
    | undefined,
  now: Date
): boolean =>
  versions?.some((version) => {
    const transformation = version.structureVersionTransformation;
    return (
      transformation?.type === StructureVersionTransformationType.CREATION &&
      transformation.transformation?.form?.status === true &&
      version.effectiveDate !== null &&
      version.effectiveDate < startOfNextUtcDay(now)
    );
  }) ?? false;

export type StructureListComputedRow = {
  id: number;
  codeBhasile: string | null;
  currentVersionId: number;
  bornFromCreation: boolean;
  hasForm: boolean;
  finalised: boolean;
  type: StructureType | null;
  operateurName: string | null;
  departementAdministratif: string | null;
  communeAdministrative: string | null;
  bati: Repartition | undefined;
  placesAutorisees: number | null;
  latestNonNullPlacesAutorisees: number | null;
  finConvention: Date | null;
  latitude: StructureListLightVersion["latitude"];
  longitude: StructureListLightVersion["longitude"];
  searchValues: string[];
  isClosed: boolean;
  fermetureDate: Date | null;
  fermetureMotif: string | null;
};

export const computeStructureListRow = (
  structure: StructureListLight,
  currentVersion: StructureListLightVersion | undefined,
  now: Date
): StructureListComputedRow | null => {
  if (!currentVersion) {
    return null;
  }

  const bornFromCreation = isBornFromCreation(structure.structureVersions, now);
  const operateurName = structure.operateur?.name ?? null;

  const searchValues = [
    structure.codeBhasile,
    currentVersion.nom,
    currentVersion.departementAdministratif,
    currentVersion.communeAdministrative,
    currentVersion.codePostalAdministratif,
    operateurName,
    ...currentVersion.dnaStructures.map(
      (dnaStructure) => dnaStructure.dna.code
    ),
    ...currentVersion.structureFinesses.map(
      (structureFiness) => structureFiness.finess.code
    ),
  ].filter((value): value is string => Boolean(value));

  const fermetureTransformation = currentVersion.structureVersionTransformation;
  const isClosed =
    fermetureTransformation?.type ===
    StructureVersionTransformationType.FERMETURE;

  return {
    id: structure.id,
    codeBhasile: structure.codeBhasile,
    currentVersionId: currentVersion.id,
    isClosed,
    fermetureDate: isClosed ? currentVersion.effectiveDate : null,
    fermetureMotif: isClosed ? (fermetureTransformation?.motif ?? null) : null,
    bornFromCreation,
    hasForm: structure.forms.length > 0,
    finalised: bornFromCreation || isFinalisationFormValidated(structure.forms),
    type: structure.type,
    operateurName,
    departementAdministratif: currentVersion.departementAdministratif,
    communeAdministrative: currentVersion.communeAdministrative,
    bati: getTypeBati(currentVersion),
    placesAutorisees:
      currentVersion.structureTypologies[0]?.placesAutorisees ?? null,
    latestNonNullPlacesAutorisees:
      currentVersion.structureTypologies.find(
        (typologie) => typologie.placesAutorisees !== null
      )?.placesAutorisees ?? null,
    finConvention: getDatesConvention(structure)[1],
    latitude: currentVersion.latitude,
    longitude: currentVersion.longitude,
    searchValues,
  };
};

export const getFermetureHistory = (
  row: StructureListComputedRow
): HistoryEvent[] =>
  row.isClosed && row.fermetureDate
    ? [
        {
          kind: "FERMETURE",
          date: row.fermetureDate.toISOString(),
          motif: row.fermetureMotif,
          targets: [],
        },
      ]
    : [];

const parsePlacesRange = (
  value: string | null | undefined
): [number | null, number | null] => {
  if (!value) {
    return [null, null];
  }
  const [minString, maxString] = value.split(",");
  const min = minString ? Number(minString) : null;
  const max = maxString ? Number(maxString) : null;
  if (min === null || max === null || Number.isNaN(min) || Number.isNaN(max)) {
    return [null, null];
  }
  return [min, max];
};

export const filterStructureRows = (
  rows: StructureListComputedRow[],
  filters: SearchProps,
  { includeNonVisible }: { includeNonVisible: boolean }
): StructureListComputedRow[] => {
  const typeList = parseCommaList(filters.type);
  const departementList = parseCommaList(filters.departements);
  const operateurList = parseCommaList(filters.operateurs);
  const batiList = parseCommaList(filters.bati).map((value) =>
    value.toUpperCase()
  );
  const search = filters.search ? normalizeAccents(filters.search) : null;
  const [placesMin, placesMax] = parsePlacesRange(filters.placesAutorisees);

  return rows.filter((row) => {
    if (!includeNonVisible && !row.hasForm && !row.bornFromCreation) {
      return false;
    }
    if (filters.isClosed && !row.isClosed) {
      return false;
    }
    if (!filters.isClosed && row.isClosed) {
      return false;
    }
    if (filters.finalised && !row.finalised) {
      return false;
    }
    if (typeList.length > 0 && (!row.type || !typeList.includes(row.type))) {
      return false;
    }
    if (
      departementList.length > 0 &&
      (!row.departementAdministratif ||
        !departementList.includes(row.departementAdministratif))
    ) {
      return false;
    }
    if (
      operateurList.length > 0 &&
      (!row.operateurName || !operateurList.includes(row.operateurName))
    ) {
      return false;
    }
    if (
      batiList.length > 0 &&
      (!row.bati || !batiList.includes(row.bati.toUpperCase()))
    ) {
      return false;
    }
    if (
      placesMin !== null &&
      placesMax !== null &&
      (row.placesAutorisees === null ||
        row.placesAutorisees < placesMin ||
        row.placesAutorisees > placesMax)
    ) {
      return false;
    }
    if (
      search &&
      !row.searchValues.some((value) =>
        normalizeAccents(value).includes(search)
      )
    ) {
      return false;
    }
    return true;
  });
};

const sortValueForColumn = (
  row: StructureListComputedRow,
  column: StructureColumn
): { value: SortValue; kind: SortKind } => {
  switch (column) {
    case "codeBhasile":
      return { value: row.codeBhasile, kind: "text" };
    case "type":
      return { value: row.type, kind: "text" };
    case "operateur":
      return { value: row.operateurName, kind: "text" };
    case "departementAdministratif":
      return { value: row.departementAdministratif, kind: "text" };
    case "bati":
      return { value: row.bati ?? null, kind: "text" };
    case "communes":
      return { value: row.communeAdministrative, kind: "text" };
    case "placesAutorisees":
      return { value: row.placesAutorisees, kind: "number" };
    case "finConvention":
      return {
        value: row.finConvention ? row.finConvention.getTime() : null,
        kind: "number",
      };
    default:
      return { value: row.codeBhasile, kind: "text" };
  }
};

export const sortStructureRows = (
  rows: StructureListComputedRow[],
  column: StructureColumn,
  direction: "asc" | "desc"
): StructureListComputedRow[] =>
  sortRows(
    rows,
    (row) => sortValueForColumn(row, column),
    (row) => ({ value: row.codeBhasile, kind: "text" }),
    direction
  );

export const getCpomStructuresWithDates = (
  structure: StructureDbDetails | StructureDbList,
  now: Date
): CpomStructureApiRead[] | undefined => {
  const cpomStructures = structure.cpomStructures?.map((cpomStructure) => {
    const [cpomDateStart, cpomDateEnd] = getCpomDatesConvention(
      cpomStructure.cpom
    );

    const cpom = cpomStructure.cpom;
    const linkedStructures =
      cpom && "structures" in cpom ? cpom.structures : undefined;

    return recursivelySerializeDates({
      ...cpomStructure,
      cpom: cpom
        ? {
            ...cpom,
            dateStart: cpomDateStart,
            dateEnd: cpomDateEnd,
            granularity: cpom.granularity,
            actesAdministratifs:
              cpom.actesAdministratifs?.map((acteAdministratif) => ({
                ...acteAdministratif,
                startDate: acteAdministratif.startDate ?? undefined,
                endDate: acteAdministratif.endDate ?? undefined,
                date: acteAdministratif.date ?? undefined,
              })) ?? [],
            ...(linkedStructures
              ? {
                  structures: linkedStructures.map((linkedStructure) =>
                    resolveLinkedStructureFields(linkedStructure, now)
                  ),
                }
              : {}),
          }
        : cpom,
    }) as CpomStructureApiRead;
  });
  return cpomStructures;
};

type CpomDetailsView = NonNullable<
  NonNullable<StructureDbDetails["cpomStructures"]>[number]["cpom"]
>;

type CpomLinkedStructureRow = CpomDetailsView extends {
  structures: (infer Row)[];
}
  ? Row
  : never;

const resolveLinkedStructureFields = (
  linkedStructure: CpomLinkedStructureRow,
  now: Date
) => {
  if (!linkedStructure.structure) {
    return linkedStructure;
  }
  return {
    ...linkedStructure,
    structure: resolveCurrentVersionFields(linkedStructure.structure, now),
  };
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

  if (creationVersion?.effectiveDate) {
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
  if (!structureVersionTransformation || !version.effectiveDate) {
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
  cpomStructures: CpomStructureApiRead[],
  now: string
): HistoryEvent[] => {
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
      regionName:
        cpom.granularity === "REGIONALE" ? (cpom.region?.name ?? null) : null,
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
  cpomStructures: CpomStructureApiRead[],
  now: Date = new Date()
): HistoryEvent[] => {
  const validVersions = getValidVersions(
    structure.structureVersions ?? [],
    now
  );

  const events = [
    buildCreationEvent(structure, validVersions),
    ...validVersions.map(buildTransformationEvent),
    ...buildCpomEvents(cpomStructures, now.toISOString()),
  ].filter((event): event is HistoryEvent => event !== null);

  return events.sort((first, second) => second.date.localeCompare(first.date));
};

export const buildUpcomingTransformations = (
  structure: StructureDbDetails,
  now: Date = new Date()
): UpcomingTransformation[] => {
  const lowerBound = startOfNextUtcDay(now);

  return (structure.structureVersions ?? [])
    .filter(
      (version) =>
        version.structureVersionTransformationId !== null &&
        version.effectiveDate !== null &&
        version.effectiveDate >= lowerBound &&
        isVersionValid(version)
    )
    .map((version) => ({
      kind: version.structureVersionTransformation!.type,
      date: version.effectiveDate!.toISOString(),
    }))
    .sort((first, second) => first.date.localeCompare(second.date));
};
