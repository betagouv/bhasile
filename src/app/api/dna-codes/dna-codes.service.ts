import { FreeDnaCode, FreeDnaCodeFilters } from "@/types/dna.type";
import { EntityId } from "@/types/Entity.type";

import { findOperateurFamille } from "../operateurs/operateur.repository";
import { findAll } from "./dna-codes.repository";

export const getDnaCodes = async ({
  operateurId,
  ...filters
}: FreeDnaCodeFilters & {
  entityId?: EntityId;
  transformationId?: number;
}): Promise<FreeDnaCode[]> => {
  const operateurIds = operateurId
    ? (await findOperateurFamille(operateurId)).map(({ id }) => id)
    : undefined;
  return findAll({ ...filters, operateurIds });
};
