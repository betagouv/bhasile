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
};

export const filterRegionsWithDepartements = (
  searchQuery: string
): RegionWithDepartements[] => {
  return REGIONS.filter((region) => region.show)
    .map((region) => {
      const matchRegion = matchesSearchQuery(region.name, searchQuery);

      const regionDepartements = getDepartementsForRegion(region.name)
        .sort((premierDepartement, secondDepartement) =>
          premierDepartement.name.localeCompare(secondDepartement.name)
        )
        .filter((departement) => {
          if (!searchQuery.trim() || matchRegion) {
            return true;
          }

          const matchNomDepartement = matchesSearchQuery(
            departement.name,
            searchQuery
          );
          const matchNumeroDepartement = matchesSearchQuery(
            departement.numero,
            searchQuery
          );

          return matchNomDepartement || matchNumeroDepartement;
        });

      return {
        region,
        departements: regionDepartements,
      };
    })
    .filter(
      (regionWithDepartements) => regionWithDepartements.departements.length > 0
    );
};
