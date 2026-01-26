import { REGION_CODES } from "@/app/utils/bhasileCode.util";
import { DEPARTEMENTS } from "@/constants";

/**
 * Récupère la région à partir du numéro de département
 */
export const getRegionFromDepartement = (
  departementNumero: string
): keyof typeof REGION_CODES | null => {
  const departement = DEPARTEMENTS.find((d) => d.numero === departementNumero);
  if (!departement || !(departement.region in REGION_CODES)) return null;
  return departement.region as keyof typeof REGION_CODES;
};

