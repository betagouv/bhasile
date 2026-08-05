import { recursivelySerializeDates } from "@/app/utils/date.util";
import { paginateWithTotal, sortRows } from "@/app/utils/list.util";
import { getNow } from "@/app/utils/now.util";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { CpomApiRead, CpomApiWrite } from "@/schemas/api/cpom.schema";
import { CpomColumn } from "@/types/ListColumn";

import { resolveCurrentVersionFields } from "../structure-versions/structure-version.util";
import { CpomDbDetails, CpomDbList } from "./cpom.db.type";
import { createOrUpdateCpom, findAllCpoms, findOne } from "./cpom.repository";
import {
  filterCpomsByDepartement,
  getDatesConvention,
  sortValueForCpomColumn,
} from "./cpom.util";

const resolveCpomStructureFields = (
  cpomStructure: CpomDbDetails["structures"][number],
  now: Date
) => {
  if (!cpomStructure.structure) {
    return cpomStructure;
  }
  return {
    ...cpomStructure,
    structure: resolveCurrentVersionFields(cpomStructure.structure, now),
  };
};

type ResolvedCpomDetails = Omit<CpomDbDetails, "structures"> & {
  structures: ReturnType<typeof resolveCpomStructureFields>[];
};

const getFullCpom = (cpom: CpomDbList | ResolvedCpomDetails): CpomApiRead => {
  const [dateStart, dateEnd] = getDatesConvention(cpom);

  return recursivelySerializeDates({
    ...cpom,
    dateStart,
    dateEnd,
  }) as CpomApiRead;
};

export const getCpoms = async ({
  page,
  departements,
  column,
  direction,
}: {
  page: number | null;
  departements: string | null;
  column: CpomColumn | null;
  direction: "asc" | "desc" | null;
}): Promise<{ cpoms: CpomApiRead[]; totalCpoms: number }> => {
  const allCpoms = await findAllCpoms();
  const filtered = filterCpomsByDepartement(allCpoms, departements);
  const sorted = sortRows(
    filtered,
    (cpom) => sortValueForCpomColumn(cpom, column ?? "region"),
    (cpom) => ({ value: cpom.id, kind: "number" }),
    direction ?? "asc"
  );
  const { total, rows } = paginateWithTotal(
    sorted,
    page ?? 0,
    DEFAULT_PAGE_SIZE
  );

  return {
    cpoms: rows.map(getFullCpom),
    totalCpoms: total,
  };
};

export const getCpomById = async (id: number): Promise<CpomApiRead | null> => {
  const cpom = await findOne(id);
  if (!cpom) {
    return null;
  }
  const now = getNow();
  const resolvedCpom = {
    ...cpom,
    structures: cpom.structures.map((cpomStructure) =>
      resolveCpomStructureFields(cpomStructure, now)
    ),
  };
  return getFullCpom(resolvedCpom);
};

export const saveCpom = async (cpom: CpomApiWrite): Promise<number> => {
  return createOrUpdateCpom(cpom);
};
