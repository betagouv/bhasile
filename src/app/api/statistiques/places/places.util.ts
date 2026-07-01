import { sumValues } from "@/app/utils/math.util";
import { roundStatsRate } from "@/app/utils/statistiques-format.util";
import {
  PlacesByYearStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbDepartement,
  StatistiqueDbStructure,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTypologieValues,
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  computeTotalPlaces,
  endOfYearUtc,
  filterByEffectiveVersionAtDate,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  getTypologieYears,
  mapTypologieYears,
  structuresActiveInPeriod,
} from "../statistiques.utils";

type PlacesSpeciales = {
  pmr: number;
  lgbt: number;
  fvvTeh: number;
};

type PlacesSpecialesAdresse = {
  qpv: number;
  logementsSociaux: number;
};

type TauxEquipement = {
  population: number | null;
  tauxEquipement: number | null;
};

type PlacesIndicators = PlacesSpeciales &
  PlacesSpecialesAdresse &
  TauxEquipement & {
    totalPlaces: number;
  };

const sumStructureTypologiePlacesSpeciales = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>
): PlacesSpeciales => {
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
  adressesInScope: StatistiqueDbAdresse[]
): PlacesSpecialesAdresse => {
  let qpv = 0;
  let logementsSociaux = 0;

  for (const adresse of adressesInScope) {
    qpv += adresse.qpv ?? 0;
    logementsSociaux += adresse.logementSocial ?? 0;
  }

  return { qpv, logementsSociaux };
};

const computeTauxEquipementAgrege = (
  totalPlaces: number,
  departements: StatistiqueDbDepartement[]
): TauxEquipement => {
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
  departements: StatistiqueDbDepartement[],
  structureVersionTimeline: StatistiqueDbStructureVersionTimeline[],
  referenceDate: Date,
  now: Date
): PlacesIndicators => {
  const structuresWithTypologie = filterStructuresWithTypologie(
    structures,
    typologieMap
  );
  const totalPlaces = computeTotalPlaces(structuresWithTypologie, typologieMap);
  const adressesInScope = filterByEffectiveVersionAtDate(
    adresses,
    structuresWithTypologie.map((structure) => structure.id),
    referenceDate,
    structureVersionTimeline,
    now
  );

  return {
    totalPlaces,
    ...computeTauxEquipementAgrege(totalPlaces, departements),
    ...sumStructureTypologiePlacesSpeciales(
      structuresWithTypologie,
      typologieMap
    ),
    ...sumAdressePlacesSpeciales(adressesInScope),
  };
};

export const computePlacesStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["places"] => {
  const {
    structures,
    allStructures,
    activeStructureIdsByPeriod,
    typologies,
    adresses,
    departements,
    structureVersionTimeline,
  } = context;
  const typologieMap = getLastTypologiePerStructure(typologies);
  const now = new Date();

  return {
    ...computePlacesIndicators(
      structures,
      typologieMap,
      adresses,
      departements,
      structureVersionTimeline,
      now,
      now
    ),
    byYear: mapTypologieYears<PlacesByYearStat>(
      allStructures,
      activeStructureIdsByPeriod,
      typologies,
      (year, structuresForYear) =>
        computePlacesIndicators(
          structuresForYear,
          getTypologieMapForExactYear(typologies, year),
          adresses,
          departements,
          structureVersionTimeline,
          endOfYearUtc(year),
          now
        )
    ),
  };
};

type PlacesTypologieField = "placesAutorisees" | "pmr" | "lgbt" | "fvvTeh";

/** Computes a single typologie field for one year, for the cartographie one-indicator requests. */
export const computeTypologieFieldForYear = (
  context: Pick<
    StatistiquesContext,
    "allStructures" | "activeStructureIdsByPeriod" | "typologies"
  >,
  year: number,
  field: PlacesTypologieField
): number | null => {
  if (!getTypologieYears(context.typologies).includes(year)) {
    return null;
  }

  const typologieMapForYear = getTypologieMapForExactYear(
    context.typologies,
    year
  );
  const structuresForYear = structuresActiveInPeriod(
    context.allStructures,
    context.activeStructureIdsByPeriod,
    "year",
    String(year)
  );
  const structuresWithTypologie = filterStructuresWithTypologie(
    structuresForYear,
    typologieMapForYear
  );

  return (
    sumValues(
      structuresWithTypologie.map(
        (structure) => typologieMapForYear.get(structure.id)?.[field]
      )
    ) ?? 0
  );
};

type PlacesAdresseField = "qpv" | "logementSocial";

/** Computes a single adresse field (qpv/logementSocial) for one year, for cartographie one-indicator requests. */
export const computeAdresseFieldForYear = (
  context: Pick<
    StatistiquesContext,
    | "allStructures"
    | "activeStructureIdsByPeriod"
    | "typologies"
    | "adresses"
    | "structureVersionTimeline"
  >,
  year: number,
  field: PlacesAdresseField
): number | null => {
  if (!getTypologieYears(context.typologies).includes(year)) {
    return null;
  }

  const typologieMapForYear = getTypologieMapForExactYear(
    context.typologies,
    year
  );
  const structuresForYear = structuresActiveInPeriod(
    context.allStructures,
    context.activeStructureIdsByPeriod,
    "year",
    String(year)
  );
  const structuresWithTypologie = filterStructuresWithTypologie(
    structuresForYear,
    typologieMapForYear
  );
  const adressesInScope = filterByEffectiveVersionAtDate(
    context.adresses,
    structuresWithTypologie.map((structure) => structure.id),
    endOfYearUtc(year),
    context.structureVersionTimeline,
    new Date()
  );

  return sumValues(adressesInScope.map((adresse) => adresse[field])) ?? 0;
};
