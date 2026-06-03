import { recursivelySerializeDates } from "@/app/utils/date.util";
import { Operateur } from "@/generated/prisma/client";
import {
  OperateurApiRead,
  OperateurApiWrite,
} from "@/schemas/api/operateur.schema";

import { getContactsApiRead } from "../contacts/contact.util";
import {
  countOperateurs,
  findBySearchTerm,
  findOne,
  getPaginatedOperateurs,
  updateOne,
} from "./operateur.repository";

export const getOperateurs = async ({
  page,
  search,
}: {
  page: number | null;
  search: string | null;
}): Promise<{ operateurs: Partial<Operateur>[]; totalOperateurs: number }> => {
  const dbOperateurs = await getPaginatedOperateurs({ page, search });

  const operateurs = dbOperateurs.map((row) => ({
    id: row.id,
    name: row.name,
    nbStructures: Number(row.nb_structures),
    totalPlaces: Number(row.total_places),
    pourcentageParc: Number(row.pourcentage_parc),
    structureTypes: String(row.structure_types)
      .replaceAll("{", "")
      .replaceAll("}", "")
      .split(","),
  }));

  const totalOperateurs = await countOperateurs({ search });

  return {
    operateurs,
    totalOperateurs,
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
