import { cache } from "react";

import { paginateWithTotal, sortRows } from "@/app/utils/list.util";
import { getNow } from "@/app/utils/now.util";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { CpomApiRead, CpomApiWrite } from "@/schemas/api/cpom.schema";
import { CpomListItem } from "@/types/cpom.type";
import { CpomColumn } from "@/types/ListColumn";
import { recursivelySerializeForClient } from "@/utils-server/serialization.server.util";

import { resolveCurrentVersionFields } from "../structure-versions/structure-version.util";
import { CpomDbDetails } from "./cpom.db.type";
import { createOrUpdateCpom, findAllCpoms, findOne } from "./cpom.repository";
import {
  buildCpomListItem,
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

const getFullCpom = (cpom: ResolvedCpomDetails): CpomApiRead => {
  const [dateStart, dateEnd] = getDatesConvention(cpom);

  return recursivelySerializeForClient({
    ...cpom,
    dateStart,
    dateEnd,
  }) as CpomApiRead;
};

// Arguments primitifs obligatoires : cache() compare avec Object.is, un objet
// littéral serait recréé à chaque appel et les Suspense requêteraient deux fois.
export const getCpoms = cache(
  async (
    page: number | null,
    departements: string | null,
    column: CpomColumn | null,
    direction: "asc" | "desc" | null
  ): Promise<{ cpoms: CpomListItem[]; totalCpoms: number }> => {
    const allCpoms = await findAllCpoms();
    const filtered = filterCpomsByDepartement(allCpoms, departements);
    const sorted = sortRows(
      filtered,
      (cpom) => sortValueForCpomColumn(cpom, column ?? "region"),
      (cpom) => ({ value: cpom.id, kind: "number" }),
      direction ?? "asc"
    );
    const { total, rows } = paginateWithTotal(sorted, page, DEFAULT_PAGE_SIZE);

    return {
      cpoms: rows.map(buildCpomListItem),
      totalCpoms: total,
    };
  }
);

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
