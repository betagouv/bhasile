import { cache } from "react";

import { DomainError } from "@/app/utils/domain-error.util";
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

import { resolveFilters } from "../filters/filters.service";
import { findRegionIdByName } from "../regions/region.repository";
import { resolveCpomLinkedStructureFields } from "../structures/structure.util";
import { CpomDbDetails, CpomDbScope, CpomToSave } from "./cpom.db.type";
import {
  createOrUpdateCpom,
  findAllCpoms,
  findCpomScope,
  findOne,
} from "./cpom.repository";
import {
  buildCpomListItem,
  getCpomDepartements,
  getDatesConvention,
  matchesCpomFilters,
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
    departements: getCpomDepartements(cpom).map((departement) => ({
      cpomId: cpom.id,
      departementNumero: departement.numero,
      departement,
    })),
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
    operateurs,
    types,
    column,
    direction,
    user,
  }: CpomsQuery): Promise<{ cpoms: CpomListItem[]; totalCpoms: number }> => {
    const readableCpoms = await findAllCpoms(getReadableCpomWhere(user));
    const filters = await resolveFilters({
      departements,
      operateurs,
      types,
    });
    const filtered = readableCpoms.filter((cpom) =>
      matchesCpomFilters(cpom, filters)
    );
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

export const prepareCpomToSave = async (
  cpom: CpomApiWrite,
  existingCpom: CpomDbScope | null
): Promise<CpomToSave> => {
  const operateurId =
    cpom.operateur?.id ?? cpom.operateurId ?? existingCpom?.operateurId;
  if (!operateurId) {
    throw new DomainError("Un CPOM doit avoir un opérateur");
  }
  const granularity = cpom.granularity ?? existingCpom?.granularity;
  if (!granularity) {
    throw new DomainError("Un CPOM doit avoir une granularité");
  }
  const regionId = cpom.region?.name
    ? await resolveRegionId(cpom.region.name)
    : (existingCpom?.regionId ?? undefined);
  if (
    granularity === "REGIONALE" &&
    !regionId &&
    existingCpom?.granularity !== "REGIONALE"
  ) {
    throw new DomainError("Un CPOM régional doit avoir une région");
  }
  return {
    ...cpom,
    operateurId,
    granularity,
    regionId,
    departements:
      granularity === "REGIONALE" && regionId ? [] : cpom.departements,
  };
};

const resolveRegionId = async (name: string): Promise<number> => {
  const regionId = await findRegionIdByName(name);
  if (!regionId) {
    throw new DomainError(`Région introuvable : ${name}`);
  }
  return regionId;
};

export const saveCpom = async (cpom: CpomToSave): Promise<number> =>
  createOrUpdateCpom(cpom);

export const getCpomScope = (id: number): Promise<CpomDbScope | null> =>
  findCpomScope(id);
