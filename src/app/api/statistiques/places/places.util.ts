import { toStatRate } from "@/app/utils/statistiques-format.util";
import {
  PlacesByYearStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbAdresseTypologie,
  StatistiqueDbDepartement,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "../statistiques.db.type";
import {
  computeTotalPlaces,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  getTypologieYears,
} from "../shared/shared.utils";

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
  typologieMap: Map<number, StatistiqueDbTypologie>
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

const sumAdresseTypologiePlacesSpeciales = (
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  structureIds: Set<number>,
  year: number
): Pick<PlacesIndicators, "qpv" | "logementsSociaux"> => {
  let qpv = 0;
  let logementsSociaux = 0;

  for (const typologie of adresseTypologies) {
    if (typologie.year !== year) {
      continue;
    }
    const structureId = typologie.adresse.structureId;
    if (structureId === null || !structureIds.has(structureId)) {
      continue;
    }
    qpv += typologie.qpv;
    logementsSociaux += typologie.logementSocial;
  }

  return { qpv, logementsSociaux };
};

const sumGlobalAdressePlacesSpeciales = (
  adresses: StatistiqueDbAdresse[],
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  structureIds: Set<number>
): Pick<PlacesIndicators, "qpv" | "logementsSociaux"> => {
  const lastTypologieByAdresse = new Map<
    number,
    StatistiqueDbAdresseTypologie
  >();

  for (const typologie of adresseTypologies) {
    const structureId = typologie.adresse.structureId;
    if (structureId === null || !structureIds.has(structureId)) {
      continue;
    }
    lastTypologieByAdresse.set(typologie.adresseId, typologie);
  }

  let qpv = 0;
  let logementsSociaux = 0;

  for (const adresse of adresses) {
    if (
      adresse.structureId === null ||
      !structureIds.has(adresse.structureId)
    ) {
      continue;
    }

    const lastTypologie = lastTypologieByAdresse.get(adresse.id);
    if (lastTypologie) {
      qpv += lastTypologie.qpv;
      logementsSociaux += lastTypologie.logementSocial;
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
    tauxEquipement: toStatRate(
      population > 0 ? totalPlaces / population : null
    ),
  };
};

const computePlacesIndicators = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>,
  adresses: StatistiqueDbAdresse[],
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  departements: StatistiqueDbDepartement[],
  year?: number
): PlacesIndicators => {
  const activeStructures = filterStructuresWithTypologie(
    structures,
    typologieMap
  );
  const structureIds = new Set(
    activeStructures.map((structure) => structure.id)
  );
  const structurePlaces = sumStructureTypologiePlacesSpeciales(
    activeStructures,
    typologieMap
  );
  const adressePlaces =
    year !== undefined
      ? sumAdresseTypologiePlacesSpeciales(
          adresseTypologies,
          structureIds,
          year
        )
      : sumGlobalAdressePlacesSpeciales(
          adresses,
          adresseTypologies,
          structureIds
        );

  const totalPlaces = computeTotalPlaces(activeStructures, typologieMap);

  return {
    totalPlaces,
    ...computeTauxEquipementAgrege(totalPlaces, departements),
    ...structurePlaces,
    ...adressePlaces,
  };
};

const computeByYearStats = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  departements: StatistiqueDbDepartement[]
): PlacesByYearStat[] =>
  getTypologieYears(typologies).map((year) => ({
    year,
    ...computePlacesIndicators(
      structures,
      getTypologieMapForExactYear(typologies, year),
      adresses,
      adresseTypologies,
      departements,
      year
    ),
  }));

export const computePlacesStatistiques = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  departements: StatistiqueDbDepartement[]
): StatistiqueApiRead["places"] => {
  const typologieMap = getLastTypologiePerStructure(typologies);

  return {
    ...computePlacesIndicators(
      structures,
      typologieMap,
      adresses,
      adresseTypologies,
      departements
    ),
    byYear: computeByYearStats(
      structures,
      typologies,
      adresses,
      adresseTypologies,
      departements
    ),
  };
};
