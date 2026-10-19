import { matchesSearchQuery } from "@/app/utils/string.util";
import { DEPARTEMENTS } from "@/constants";
import { REGIONS } from "@/constants";
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

type RegionWithDepartements = {
  region: (typeof REGIONS)[number];
  departements: ReturnType<typeof getDepartementsForRegion>;
  hasMatchingDepartement: boolean;
};

export const filterRegionsWithDepartements = (
  searchQuery: string
): RegionWithDepartements[] => {
  return REGIONS.filter((region) => region.show).map((region) => {
    const regionDepartements = getDepartementsForRegion(region.name).sort(
      (premierDepartement, secondDepartement) =>
        premierDepartement.name.localeCompare(secondDepartement.name)
    );

    if (!searchQuery.trim()) {
      return {
        region,
        departements: regionDepartements,
        hasMatchingDepartement: false,
      };
    }

    const matchingDepartements = regionDepartements.filter(
      (departement) =>
        matchesSearchQuery(departement.name, searchQuery) ||
        matchesSearchQuery(departement.numero, searchQuery)
    );

    return {
      region,
      departements: matchesSearchQuery(region.name, searchQuery)
        ? regionDepartements
        : matchingDepartements,
      hasMatchingDepartement: matchingDepartements.length > 0,
    };
  });
};
