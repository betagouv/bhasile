import { roundStatsRate } from "@/app/utils/statistiques-format.util";
import {
  PlacesByYearStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbDepartement,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
  StatistiqueDbTypologieValues,
  StatistiquesContext,
  StatistiquesActivityContext,
} from "../statistiques.db.type";
import {
  computeTotalPlaces,
  filterStructuresForPeriod,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  getTypologieYears,
} from "../statistiques.utils";

type PlacesIndicators = Pick<
  StatistiqueApiRead["places"],
  | "totalPlaces"
  | "population"
  | "tauxEquipement"
  | "pmr"
  | "lgbt"
  | "fvvTeh"
  | "qpv"
  | "logementsSociaux"
>;

const sumStructureTypologiePlacesSpeciales = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>
): Pick<PlacesIndicators, "pmr" | "lgbt" | "fvvTeh"> => {
  let pmr = 0;
  let lgbt = 0;
  let fvvTeh = 0;

  for (const structure of structures) {
    const typologie = typologieMap.get(structure.id);
    if (!typologie) {
      continue;
    }
    pmr += typologie.pmr ?? 0;
    lgbt += typologie.lgbt ?? 0;
    fvvTeh += typologie.fvvTeh ?? 0;
  }

  return { pmr, lgbt, fvvTeh };
};

const sumAdressePlacesSpeciales = (
  adresses: StatistiqueDbAdresse[],
  structureIds: Set<number>
): Pick<PlacesIndicators, "qpv" | "logementsSociaux"> => {
  let qpv = 0;
  let logementsSociaux = 0;

  for (const adresse of adresses) {
    if (
      adresse.structureId === null ||
      !structureIds.has(adresse.structureId)
    ) {
      continue;
    }
    qpv += adresse.qpv ?? 0;
    logementsSociaux += adresse.logementSocial ?? 0;
  }

  return { qpv, logementsSociaux };
};

const computeTauxEquipementAgrege = (
  totalPlaces: number,
  departements: StatistiqueDbDepartement[]
): Pick<PlacesIndicators, "population" | "tauxEquipement"> => {
  if (departements.length === 0) {
    return { population: null, tauxEquipement: null };
  }

  const hasAllPopulations = departements.every(
    (departement) => departement.population != null
  );
  if (!hasAllPopulations) {
    return { population: null, tauxEquipement: null };
  }

  const population = departements.reduce(
    (sum, departement) => sum + (departement.population ?? 0),
    0
  );

  return {
    population,
    tauxEquipement: roundStatsRate(
      population > 0 ? totalPlaces / population : null
    ),
  };
};

const computePlacesIndicators = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>,
  adresses: StatistiqueDbAdresse[],
  departements: StatistiqueDbDepartement[]
): PlacesIndicators => {
  const structuresWithTypologie = filterStructuresWithTypologie(
    structures,
    typologieMap
  );
  const structureIds = new Set(
    structuresWithTypologie.map((structure) => structure.id)
  );
  const totalPlaces = computeTotalPlaces(structuresWithTypologie, typologieMap);

  return {
    totalPlaces,
    ...computeTauxEquipementAgrege(totalPlaces, departements),
    ...sumStructureTypologiePlacesSpeciales(
      structuresWithTypologie,
      typologieMap
    ),
    ...sumAdressePlacesSpeciales(adresses, structureIds),
  };
};

const computeByYearStats = (
  allStructures: StatistiqueDbStructure[],
  activityContext: StatistiquesActivityContext,
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  departements: StatistiqueDbDepartement[]
): PlacesByYearStat[] =>
  getTypologieYears(typologies).map((year) => {
    const structuresForYear = filterStructuresForPeriod(
      allStructures,
      "year",
      String(year),
      activityContext
    );

    return {
      year,
      ...computePlacesIndicators(
        structuresForYear,
        getTypologieMapForExactYear(typologies, year),
        adresses,
        departements
      ),
    };
  });

export const computePlacesStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["places"] => {
  const { structures, allStructures, activityContext, typologies, adresses, departements } =
    context;
  const typologieMap = getLastTypologiePerStructure(typologies);

  return {
    ...computePlacesIndicators(
      structures,
      typologieMap,
      adresses,
      departements
    ),
    byYear: computeByYearStats(
      allStructures,
      activityContext,
      typologies,
      adresses,
      departements
    ),
  };
};
