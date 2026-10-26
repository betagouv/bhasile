import { cache } from "react";

import { paginateWithTotal, sortRows } from "@/app/utils/list.util";
import { getNow } from "@/app/utils/now.util";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import {
  canAbilityReadCpom,
  defineAbilityFor,
  getReadableCpomWhere,
} from "@/lib/casl";
import { CpomApiRead, CpomApiWrite } from "@/schemas/api/cpom.schema";
import { CpomListItem, CpomsQuery } from "@/types/cpom.type";
import { SessionUser } from "@/types/global";
import { recursivelySerializeForClient } from "@/utils-server/serialization.server.util";

import { resolveCpomLinkedStructureFields } from "../structures/structure.util";
import { CpomDbDetails, CpomDbScope } from "./cpom.db.type";
import {
  createOrUpdateCpom,
  findAllCpoms,
  findCpomScope,
  findOne,
} from "./cpom.repository";
import {
  buildCpomListItem,
  filterCpomsByDepartement,
  getDatesConvention,
  sortValueForCpomColumn,
} from "./cpom.util";

type ResolvedCpomDetails = Omit<CpomDbDetails, "structures"> & {
  structures: ReturnType<
    typeof resolveCpomLinkedStructureFields<CpomDbDetails["structures"][number]>
  >[];
};

const getFullCpom = (cpom: ResolvedCpomDetails): CpomApiRead => {
  const [dateStart, dateEnd] = getDatesConvention(cpom);

  return recursivelySerializeForClient({
    ...cpom,
    dateStart,
    dateEnd,
  }) as CpomApiRead;
};

// Mémoïsé sur la référence de query : la page construit une seule query et la
// passe à chaque Suspense, donc compteur et tableau partagent le cache.
export const getCpoms = cache(
  async ({
    page,
    departements,
    column,
    direction,
    user,
  }: CpomsQuery): Promise<{ cpoms: CpomListItem[]; totalCpoms: number }> => {
    const readableCpoms = await findAllCpoms(getReadableCpomWhere(user));
    const filtered = filterCpomsByDepartement(readableCpoms, departements);
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

export const getCpomById = async (
  id: number,
  user: SessionUser | undefined
): Promise<CpomApiRead | null> => {
  const cpom = await findOne(id);
  if (!cpom || !canAbilityReadCpom(defineAbilityFor(user), cpom)) {
    return null;
  }
  const now = getNow();
  const resolvedCpom = {
    ...cpom,
    structures: cpom.structures.map((cpomStructure) =>
      resolveCpomLinkedStructureFields(cpomStructure, now)
    ),
  };
  return getFullCpom(resolvedCpom);
};

export const saveCpom = async (cpom: CpomApiWrite): Promise<number> => {
  return createOrUpdateCpom(cpom);
};

export const getCpomScope = (id: number): Promise<CpomDbScope | null> =>
  findCpomScope(id);
