import { findAll } from "./dna-codes.repository";

export const getDnaCodes = async (
  structureId: number
): Promise<{ code: string }[]> => {
  return findAll({ structureId });
};
