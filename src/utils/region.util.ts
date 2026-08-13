import { DEPARTEMENTS } from "@/constants";
import { Departement } from "@/types/departement.type";

export const getRegionFromDepartement = (
  departementNumero: string
): string | null => {
  const departement = DEPARTEMENTS.find(
    (departement) => departement.numero === departementNumero
  );

  return departement?.region ?? null;
};

export const getDepartementsForRegion = (regionName: string): Departement[] =>
  DEPARTEMENTS.filter((departement) => departement.region === regionName);

export const getDepartementNumerosForRegion = (regionName: string): string[] =>
  getDepartementsForRegion(regionName).map((departement) => departement.numero);
