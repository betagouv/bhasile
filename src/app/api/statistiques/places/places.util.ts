import { sumValues } from "@/app/utils/math.util";
import { getNow } from "@/app/utils/now.util";
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
  StatistiquesAdresseSnapshotContext,
  StatistiquesContext,
  StatistiquesTypologieYearContext,
} from "../statistiques.db.type";
import {
  computeTotalPlaces,
  filterByEffectiveVersionAtDate,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  mapTypologieYears,
  resolveStructuresWithTypologieForYear,
} from "../statistiques.util";

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

type PlacesTypologieIndicators = PlacesSpeciales &
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
    const places = adresse.placesAutorisees ?? 0;
    qpv += adresse.isQpv ? places : 0;
    logementsSociaux += adresse.isLogementSocial ? places : 0;
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

const computePlacesTypologieIndicators = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>,
  departements: StatistiqueDbDepartement[]
): PlacesTypologieIndicators => {
  const structuresWithTypologie = filterStructuresWithTypologie(
    structures,
    typologieMap
  );
  const totalPlaces = computeTotalPlaces(structuresWithTypologie, typologieMap);

  return {
    totalPlaces,
    ...computeTauxEquipementAgrege(totalPlaces, departements),
    ...sumStructureTypologiePlacesSpeciales(
      structuresWithTypologie,
      typologieMap
    ),
  };
};

// QPV / logement social : pas d'historique conservé → snapshot à date (version
// courante), sur toutes les structures du périmètre (indépendant de la typologie).
const computeAdressePlacesSpecialesSnapshot = (
  structures: StatistiqueDbStructure[],
  adresses: StatistiqueDbAdresse[],
  structureVersionTimeline: StatistiqueDbStructureVersionTimeline[],
  now: Date
): PlacesSpecialesAdresse => {
  const adressesInScope = filterByEffectiveVersionAtDate(
    adresses,
    structures.map((structure) => structure.id),
    now,
    structureVersionTimeline,
    now
  );
  return sumAdressePlacesSpeciales(adressesInScope);
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
  const now = getNow();

  return {
    ...computePlacesTypologieIndicators(structures, typologieMap, departements),
    ...computeAdressePlacesSpecialesSnapshot(
      structures,
      adresses,
      structureVersionTimeline,
      now
    ),
    byYear: mapTypologieYears<PlacesByYearStat>(
      allStructures,
      activeStructureIdsByPeriod,
      typologies,
      (year, structuresForYear) =>
        computePlacesTypologieIndicators(
          structuresForYear,
          getTypologieMapForExactYear(typologies, year),
          departements
        )
    ),
  };
};

type PlacesTypologieField = "placesAutorisees" | "pmr" | "lgbt" | "fvvTeh";

/** Computes a single typologie field for one year, for the cartographie one-indicator requests. */
export const computeTypologieFieldForYear = (
  context: StatistiquesTypologieYearContext,
  year: number,
  field: PlacesTypologieField
): number | null => {
  const resolved = resolveStructuresWithTypologieForYear(context, year);
  if (!resolved) {
    return null;
  }

  return (
    sumValues(
      resolved.structures.map(
        (structure) => resolved.typologieMap.get(structure.id)?.[field]
      )
    ) ?? 0
  );
};

/** Snapshot QPV / logement social à date (version courante), pour la cartographie. */
export const computeAdresseSnapshot = (
  context: StatistiquesAdresseSnapshotContext,
  field: keyof PlacesSpecialesAdresse
): number =>
  computeAdressePlacesSpecialesSnapshot(
    context.structures,
    context.adresses,
    context.structureVersionTimeline,
    getNow()
  )[field];
