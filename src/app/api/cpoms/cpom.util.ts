import { type SortKind, type SortValue } from "@/app/utils/list.util";
import { parseCommaList } from "@/app/utils/string.util";
import { CpomColumn } from "@/types/ListColumn";

import { getDatesOfCurrentActeAdministratif } from "../actes-administratifs/acte-administratif.util";
import { CpomDbDetails, CpomDbList } from "./cpom.db.type";

export const getDatesConvention = (cpom?: {
  actesAdministratifs: (CpomDbDetails | CpomDbList)["actesAdministratifs"];
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
