import { DEPARTEMENTS } from "@/constants";

export const getRegionFromDepartement = (
  departementNumero: string
): string | null => {
  const departement = DEPARTEMENTS.find(
    (departement) => departement.numero === departementNumero
  );

  return departement?.region ?? null;
};
