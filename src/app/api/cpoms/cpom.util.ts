import { type SortKind, type SortValue } from "@/app/utils/list.util";
import { CpomGranularity, CpomListItem } from "@/types/cpom.type";
import { CpomColumn } from "@/types/ListColumn";
import {
  matchesGlobalFilters,
  ParsedGlobalFilters,
} from "@/utils/global-filters.util";

import {
  type ActeAdministratifDates,
  getDatesOfCurrentActeAdministratif,
} from "../actes-administratifs/acte-administratif.util";
import { CpomDbList } from "./cpom.db.type";

// Un CPOM régional couvre tous les départements de sa région : ils ne sont pas
// stockés dans CpomDepartement, réservé aux CPOM (inter)départementaux.
export const getCpomDepartements = <D extends { numero: string }>(cpom: {
  granularity: CpomGranularity;
  region: { departements: D[] } | null;
  departements: { departement: D }[];
}): D[] =>
  cpom.granularity === "REGIONALE" && cpom.region
    ? cpom.region.departements
    : cpom.departements.map(({ departement }) => departement);

export const getCpomDepartementNumeros = (
  cpom: Parameters<typeof getCpomDepartements>[0]
): string[] => getCpomDepartements(cpom).map(({ numero }) => numero);

export const getDatesConvention = (cpom?: {
  actesAdministratifs: ActeAdministratifDates[];
}): [Date | null, Date | null] => {
  if (!cpom) {
    return [null, null];
  }

  return getDatesOfCurrentActeAdministratif(
    cpom.actesAdministratifs ?? [],
    "CONVENTION_CPOM",
    false
  );
};

export const shouldEndCpomStructureAtFermeture = (
  cpomStructure: {
    dateStart: Date | null;
    dateEnd: Date | null;
    cpom: { actesAdministratifs: ActeAdministratifDates[] };
  },
  fermetureDate: Date
): boolean => {
  const [conventionStart, conventionEnd] = getDatesConvention(
    cpomStructure.cpom
  );
  const dateStart = cpomStructure.dateStart ?? conventionStart;
  const dateEnd = cpomStructure.dateEnd ?? conventionEnd;

  if (dateStart && dateStart > fermetureDate) {
    return false;
  }
  return !dateEnd || dateEnd > fermetureDate;
};

export const getCpomStructureIdsToEndAtFermeture = (
  cpomStructures: (Parameters<typeof shouldEndCpomStructureAtFermeture>[0] & {
    id: number;
  })[],
  fermetureDate: Date
): number[] =>
  cpomStructures
    .filter((cpomStructure) =>
      shouldEndCpomStructureAtFermeture(cpomStructure, fermetureDate)
    )
    .map((cpomStructure) => cpomStructure.id);

export const filterCpomsByGlobalFilters = (
  cpoms: CpomDbList[],
  filters: ParsedGlobalFilters
): CpomDbList[] =>
  cpoms.filter((cpom) =>
    matchesGlobalFilters(
      {
        departements: getCpomDepartementNumeros(cpom),
        operateurIds: [cpom.operateurId],
        types: cpom.structures.map(
          (cpomStructure) => cpomStructure.structure.type
        ),
      },
      filters
    )
  );

const getSortableTime = (date: Date | null): SortValue =>
  date ? date.getTime() : null;

export const sortValueForCpomColumn = (
  cpom: CpomDbList,
  column: CpomColumn
): { value: SortValue; kind: SortKind } => {
  switch (column) {
    case "operateur":
      return { value: cpom.operateur.name, kind: "text" };
    case "structures":
      return { value: cpom.structures.length, kind: "number" };
    case "granularity":
      return { value: cpom.granularity, kind: "text" };
    case "region":
      return { value: cpom.region?.name ?? null, kind: "text" };
    case "departements":
      return {
        value: getCpomDepartementNumeros(cpom).sort().join(", "),
        kind: "text",
      };
    case "dateStart":
      return {
        value: getSortableTime(getDatesConvention(cpom)[0]),
        kind: "number",
      };
    case "dateEnd":
      return {
        value: getSortableTime(getDatesConvention(cpom)[1]),
        kind: "number",
      };
    default:
      return { value: null, kind: "text" };
  }
};

export const buildCpomListItem = (cpom: CpomDbList): CpomListItem => {
  const [dateStart, dateEnd] = getDatesConvention(cpom);

  return {
    id: cpom.id,
    operateurName: cpom.operateur.name,
    granularity: cpom.granularity,
    regionName: cpom.region?.name,
    departementNumeros: getCpomDepartementNumeros(cpom),
    dateStart: dateStart?.toISOString(),
    dateEnd: dateEnd?.toISOString(),
    structureCount: cpom.structures.length,
    isFinalised: Boolean(
      cpom.actesAdministratifs?.[0]?.fileUploads?.[0]?.key &&
      dateStart &&
      dateEnd
    ),
  };
};
