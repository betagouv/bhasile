import { type SortKind, type SortValue } from "@/app/utils/list.util";
import { parseCommaList } from "@/app/utils/string.util";
import { CpomListItem } from "@/types/cpom.type";
import { CpomColumn } from "@/types/ListColumn";

import {
  type ActeAdministratifDates,
  getDatesOfCurrentActeAdministratif,
} from "../actes-administratifs/acte-administratif.util";
import { CpomDbList } from "./cpom.db.type";

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

export const filterCpomsByDepartement = (
  cpoms: CpomDbList[],
  departements: string | null
): CpomDbList[] => {
  const departementList = parseCommaList(departements);
  if (departementList.length === 0) {
    return cpoms;
  }
  return cpoms.filter((cpom) =>
    cpom.departements.some((cpomDepartement) =>
      departementList.includes(cpomDepartement.departement.numero)
    )
  );
};

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
        value: cpom.departements
          .map((cpomDepartement) => cpomDepartement.departement.numero)
          .sort()
          .join(", "),
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
    departementNumeros: cpom.departements.map(
      (cpomDepartement) => cpomDepartement.departement.numero
    ),
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
