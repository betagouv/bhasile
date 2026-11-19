import { FreeDnaCode, FreeDnaCodeFilters } from "@/types/dna.type";
import { EntityId } from "@/types/Entity.type";

import { findAll } from "./dna-codes.repository";

export const getDnaCodes = async (
  filters: FreeDnaCodeFilters & {
    entityId?: EntityId;
    transformationId?: number;
  }
): Promise<FreeDnaCode[]> => {
  return findAll(filters);
};
