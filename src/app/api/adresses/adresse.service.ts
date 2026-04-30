import { checkAdressesExistence } from "./adresse.repository";

export const hasStructureAdresses = async (
  structureId: number
): Promise<boolean> => {
  return checkAdressesExistence(structureId);
};
