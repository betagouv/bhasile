import {
  PlacesSpecialesStat,
  PlacesYearStat,
  StatistiqueApiRead,
  TauxEquipementDept,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbAdresseTypologie,
  StatistiqueDbDepartement,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "../shared/db.type";
import {
  computeTotalPlaces,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  getTypologieYears,
} from "../shared/utils";

const sumAdressePlacesSpeciales = (
  adresses: StatistiqueDbAdresse[]
): Pick<PlacesSpecialesStat, "qpv" | "logementsSociaux"> => ({
  qpv: adresses.reduce((acc, adresse) => acc + (adresse.qpv ?? 0), 0),
  logementsSociaux: adresses.reduce(
    (acc, adresse) => acc + (adresse.logementSocial ?? 0),
    0
  ),
});

const sumAdresseTypologiePlacesSpeciales = (
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  year: number
): Pick<PlacesSpecialesStat, "qpv" | "logementsSociaux"> => {
  const filtered = adresseTypologies.filter(
    (typologie) => typologie.year === year
  );
  return {
    qpv: filtered.reduce((acc, typologie) => acc + typologie.qpv, 0),
    logementsSociaux: filtered.reduce(
      (acc, typologie) => acc + typologie.logementSocial,
      0
    ),
  };
};

export const computePlacesSpeciales = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>,
  adresses: StatistiqueDbAdresse[],
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  year?: number
): PlacesSpecialesStat => {
  let pmr = 0,
    lgbt = 0,
    fvvTeh = 0;
  for (const structure of structures) {
    const typologie = typologieMap.get(structure.id);
    if (!typologie) {
      continue;
    }
    pmr += typologie.pmr ?? 0;
    lgbt += typologie.lgbt ?? 0;
    fvvTeh += typologie.fvvTeh ?? 0;
  }

  const structureIds = new Set(structures.map((structure) => structure.id));
  const relevantAdresses = adresses.filter(
    (adresse) =>
      adresse.structureId !== null && structureIds.has(adresse.structureId)
  );

  const adressePlaces =
    year !== undefined
      ? sumAdresseTypologiePlacesSpeciales(adresseTypologies, year)
      : sumAdressePlacesSpeciales(relevantAdresses);

  return { pmr, lgbt, fvvTeh, ...adressePlaces };
};

export const computeTauxEquipement = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>,
  departements: StatistiqueDbDepartement[]
): TauxEquipementDept[] => {
  const placesByDept = new Map<string, number>();
  for (const structure of structures) {
    if (!structure.departementAdministratif) {
      continue;
    }
    const typologie = typologieMap.get(structure.id);
    if (!typologie) {
      continue;
    }
    placesByDept.set(
      structure.departementAdministratif,
      (placesByDept.get(structure.departementAdministratif) ?? 0) +
        (typologie.placesAutorisees ?? 0)
    );
  }
  return departements.map((dept) => {
    const places = placesByDept.get(dept.numero) ?? 0;
    return {
      departement: dept.numero,
      nom: dept.name,
      places,
      population: dept.population,
      tauxPour1000: dept.population ? (places / dept.population) * 1000 : null,
    };
  });
};

export const computeGlobalPlacesStats = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  departements: StatistiqueDbDepartement[]
): Pick<
  StatistiqueApiRead["places"],
  "totalPlaces" | "placesSpeciales" | "tauxEquipement"
> => {
  const typologieMap = getLastTypologiePerStructure(typologies);
  const activeStructures = filterStructuresWithTypologie(structures, typologieMap);

  return {
    totalPlaces: computeTotalPlaces(activeStructures, typologieMap),
    placesSpeciales: computePlacesSpeciales(
      activeStructures,
      typologieMap,
      adresses,
      adresseTypologies
    ),
    tauxEquipement: computeTauxEquipement(
      activeStructures,
      typologieMap,
      departements
    ),
  };
};

export const computePlacesYearStats = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  adresseTypologies: StatistiqueDbAdresseTypologie[]
): PlacesYearStat[] =>
  getTypologieYears(typologies).map((year) => {
    const typologieMap = getTypologieMapForExactYear(typologies, year);
    const activeStructures = filterStructuresWithTypologie(structures, typologieMap);

    return {
      year,
      totalPlaces: computeTotalPlaces(activeStructures, typologieMap),
      placesSpeciales: computePlacesSpeciales(
        activeStructures,
        typologieMap,
        adresses,
        adresseTypologies,
        year
      ),
    };
  });
