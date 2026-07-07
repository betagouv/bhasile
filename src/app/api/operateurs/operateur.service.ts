import { recursivelySerializeDates } from "@/app/utils/date.util";
import { paginateRows, sortRows } from "@/app/utils/list.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { Operateur } from "@/generated/prisma/client";
import {
  OperateurApiRead,
  OperateurApiWrite,
} from "@/schemas/api/operateur.schema";

import { getContactsApiRead } from "../contacts/contact.util";
import { findAllStructures } from "../structures/structure.repository";
import {
  findAllOperateurs,
  findBySearchTerm,
  findOne,
  updateOne,
} from "./operateur.repository";
import {
  buildOperateurListItem,
  buildTopLevelOperateurMap,
  filterOperateursBySearch,
  groupStructureStatsByOperateur,
  OperateurListItem,
} from "./operateur.util";

export const getOperateurs = async ({
  page,
  search,
}: {
  page: number | null;
  search: string | null;
}): Promise<{ operateurs: OperateurListItem[]; totalOperateurs: number }> => {
  const now = new Date();
  const [structures, operateurs] = await Promise.all([
    findAllStructures(),
    findAllOperateurs(),
  ]);

  const topLevelByOperateurId = buildTopLevelOperateurMap(operateurs);
  const { statsByOperateurId, globalPlaces } = groupStructureStatsByOperateur(
    structures,
    topLevelByOperateurId,
    now
  );

  const items = operateurs
    .filter((operateur) => operateur.parentId === null)
    .flatMap((operateur) => {
      const stats = statsByOperateurId.get(operateur.id);
      if (!stats) {
        return [];
      }
      return [buildOperateurListItem(operateur, stats, globalPlaces)];
    });

  const filtered = filterOperateursBySearch(items, search);
  const sorted = sortRows(
    filtered,
    (operateur) => ({ value: operateur.nbStructures, kind: "number" }),
    (operateur) => ({ value: operateur.id, kind: "number" }),
    "desc"
  );

  return {
    operateurs: paginateRows(sorted, page ?? 0, MIDDLE_PAGE_SIZE),
    totalOperateurs: filtered.length,
  };
};

export const getOperateur = async (id: number): Promise<OperateurApiRead> => {
  const operateur = await findOne(id);

  return recursivelySerializeDates({
    ...operateur,
    actesAdministratifs: operateur.actesAdministratifs,
    contacts: getContactsApiRead(operateur.contacts),
  }) as OperateurApiRead;
};

export const updateOperateur = async (
  operateur: OperateurApiWrite
): Promise<Operateur> => {
  return updateOne(operateur);
};

export const getOperateursSuggestions = async (
  search: string | null
): Promise<Operateur[]> => {
  return findBySearchTerm(search);
};
