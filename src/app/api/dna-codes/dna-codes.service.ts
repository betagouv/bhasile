import { EntityId } from "@/types/Entity.type";

import { findAll } from "./dna-codes.repository";

export const getDnaCodes = async (
  entityId: EntityId = {},
  transformationId?: number,
  operateurId?: number
): Promise<{ code: string }[]> => {
  return findAll({ entityId, operateurId, transformationId });
};
