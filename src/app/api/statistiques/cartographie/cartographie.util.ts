import type { NumericAggregation } from "@/app/utils/math.util";
import {
  CartographieEvolutionStat,
  CartographieIndicateur,
  CartographieSupportedGranularite,
  StatistiqueCartographieFilters,
} from "@/schemas/api/statistique-cartographie.schema";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { computeActiviteStatistiques } from "../activite/activite.util";
import { computeControleQualiteStatistiques } from "../controle-qualite/controle-qualite.util";
import { computeFinanceStatistiques } from "../finance/finance.util";
import { computePlacesStatistiques } from "../places/places.util";
import type {
  StatistiqueDbStructure,
  StatistiquesContext,
} from "../statistiques.db.type";
import { computeStructuresStatistiques } from "../structures/structures.util";
import type {
  CartographieDbDepartement,
  CartographieDbRegion,
} from "./cartographie.repository";

export type CartographieZoneDefinition = {
  code: string;
  name: string;
  departementNumeros: string[];
};

export const groupStructureIdsByDepartement = (
  structures: StatistiqueDbStructure[]
): Map<string, Set<number>> => {
  const groups = new Map<string, Set<number>>();

  for (const structure of structures) {
    if (!structure.departementAdministratif) {
      continue;
    }
    const structureIds =
      groups.get(structure.departementAdministratif) ?? new Set<number>();
    structureIds.add(structure.id);
    groups.set(structure.departementAdministratif, structureIds);
  }

  return groups;
};

/** CSV `departements`/`regions` -> ensemble de numéros de départements, ou `null` si aucune restriction ("Toute la France"). */
export const resolveZoneDepartementNumeros = (
  filters: Pick<StatistiqueCartographieFilters, "departements" | "regions">,
  allDepartements: CartographieDbDepartement[]
): Set<string> | null => {
  const departementList = filters.departements?.split(",").filter(Boolean) ?? [];
  const regionList = filters.regions?.split(",").filter(Boolean) ?? [];

  if (departementList.length === 0 && regionList.length === 0) {
    return null;
  }

  if (regionList.length === 0) {
    return new Set(departementList);
  }

  const regionSet = new Set(regionList);
  const departementsFromRegions = allDepartements
    .filter(
      (departement) =>
        departement.regionCode && regionSet.has(departement.regionCode)
    )
    .map((departement) => departement.numero);

  if (departementList.length === 0) {
    return new Set(departementsFromRegions);
  }

  // Les deux filtres sont fournis : intersection (restriction la plus stricte).
  const departementsFromRegionsSet = new Set(departementsFromRegions);
  return new Set(
    departementList.filter((numero) => departementsFromRegionsSet.has(numero))
  );
};

/** Liste canonique des zones à retourner pour le découpage choisi, y compris celles sans structure. */
export const buildZoneDefinitions = (
  granularite: CartographieSupportedGranularite,
  allDepartements: CartographieDbDepartement[],
  allRegions: CartographieDbRegion[],
  departementNumerosRestriction: Set<string> | null
): CartographieZoneDefinition[] => {
  const departementsInScope = departementNumerosRestriction
    ? allDepartements.filter((departement) =>
        departementNumerosRestriction.has(departement.numero)
      )
    : allDepartements;

  if (granularite === "departement") {
    return departementsInScope
      .map((departement) => ({
        code: departement.numero,
        name: departement.name,
        departementNumeros: [departement.numero],
      }))
      .sort((zoneA, zoneB) => zoneA.code.localeCompare(zoneB.code));
  }

  const departementNumerosByRegionCode = new Map<string, string[]>();
  const regionNameByCode = new Map<string, string>();

  for (const departement of departementsInScope) {
    if (!departement.regionCode) {
      continue;
    }
    regionNameByCode.set(
      departement.regionCode,
      departement.regionName ?? departement.regionCode
    );
    const numeros = departementNumerosByRegionCode.get(departement.regionCode) ?? [];
    numeros.push(departement.numero);
    departementNumerosByRegionCode.set(departement.regionCode, numeros);
  }

  // Sans restriction de zone, on complète avec les régions sans département rattaché (cas théorique).
  if (!departementNumerosRestriction) {
    for (const region of allRegions) {
      if (!departementNumerosByRegionCode.has(region.code)) {
        departementNumerosByRegionCode.set(region.code, []);
        regionNameByCode.set(region.code, region.name);
      }
    }
  }

  return [...departementNumerosByRegionCode.entries()]
    .map(([code, departementNumeros]) => ({
      code,
      name: regionNameByCode.get(code) ?? code,
      departementNumeros,
    }))
    .sort((zoneA, zoneB) => zoneA.code.localeCompare(zoneB.code));
};

export const computeEvolution = (
  value: number | null,
  previousValue: number | null
): CartographieEvolutionStat | null => {
  if (value == null || previousValue == null) {
    return null;
  }

  const delta = value - previousValue;

  return {
    previousValue,
    delta,
    direction: delta > 0 ? "hausse" : delta < 0 ? "baisse" : "stable",
  };
};

type IndicateurEntry =
  | {
      bloc: "structures";
      extract: (
        stats: StatistiqueApiRead["structures"],
        year: number
      ) => number | null;
    }
  | {
      bloc: "places";
      extract: (
        stats: StatistiqueApiRead["places"],
        year: number
      ) => number | null;
    }
  | {
      bloc: "finance";
      extract: (
        stats: StatistiqueApiRead["finance"],
        year: number
      ) => number | null;
    }
  | {
      bloc: "controleQualite";
      extract: (
        stats: StatistiqueApiRead["controleQualite"],
        year: number
      ) => number | null;
    }
  | {
      bloc: "activite";
      /** L'activité n'a pas d'agrégation par année civile pour l'instant (cf. README) : `year` est ignoré. */
      extract: (stats: StatistiqueApiRead["activite"]) => number | null;
    };

const findByYear = <Entry extends { year: number }>(
  entries: Entry[],
  year: number
): Entry | undefined => entries.find((entry) => entry.year === year);

export const INDICATEUR_REGISTRY: Record<CartographieIndicateur, IndicateurEntry> = {
  "structures.total": {
    bloc: "structures",
    extract: (stats, year) => findByYear(stats.byYear, year)?.totalStructures ?? null,
  },
  "structures.avecCpom": {
    bloc: "structures",
    extract: (stats, year) =>
      findByYear(stats.byYear, year)?.structuresAvecCpom ?? null,
  },
  "places.autorisees": {
    bloc: "places",
    extract: (stats, year) => findByYear(stats.byYear, year)?.totalPlaces ?? null,
  },
  "places.pmr": {
    bloc: "places",
    extract: (stats, year) => findByYear(stats.byYear, year)?.pmr ?? null,
  },
  "places.lgbt": {
    bloc: "places",
    extract: (stats, year) => findByYear(stats.byYear, year)?.lgbt ?? null,
  },
  "places.fvvTeh": {
    bloc: "places",
    extract: (stats, year) => findByYear(stats.byYear, year)?.fvvTeh ?? null,
  },
  "places.qpv": {
    bloc: "places",
    extract: (stats, year) => findByYear(stats.byYear, year)?.qpv ?? null,
  },
  "places.logementsSociaux": {
    bloc: "places",
    extract: (stats, year) =>
      findByYear(stats.byYear, year)?.logementsSociaux ?? null,
  },
  "finance.dotationAccordee": {
    bloc: "finance",
    extract: (stats, year) =>
      findByYear(stats.byYear, year)?.total.dotationAccordee ?? null,
  },
  "finance.etp": {
    bloc: "finance",
    extract: (stats, year) => findByYear(stats.byYear, year)?.total.totalETP ?? null,
  },
  "finance.tauxEncadrement": {
    bloc: "finance",
    extract: (stats, year) =>
      findByYear(stats.byYear, year)?.total.tauxEncadrement ?? null,
  },
  "finance.coutJournalier": {
    bloc: "finance",
    extract: (stats, year) =>
      findByYear(stats.byYear, year)?.total.coutJournalier ?? null,
  },
  "finance.resultatNet": {
    bloc: "finance",
    extract: (stats, year) =>
      findByYear(stats.byYear, year)?.total.resultatNet ?? null,
  },
  "controleQualite.nbEig": {
    bloc: "controleQualite",
    extract: (stats, year) =>
      stats.byYear.find((entry) => entry.date.getUTCFullYear() === year)?.nbEig ??
      null,
  },
  "controleQualite.tauxEigComportementViolent": {
    bloc: "controleQualite",
    extract: (stats, year) =>
      stats.byYear.find((entry) => entry.date.getUTCFullYear() === year)
        ?.tauxEigComportementViolent ?? null,
  },
  "controleQualite.moyenneEvaluations": {
    bloc: "controleQualite",
    extract: (stats, year) =>
      stats.byYear.find((entry) => entry.date.getUTCFullYear() === year)
        ?.noteGenerale ?? null,
  },
  "activite.placesDna": {
    bloc: "activite",
    extract: (stats) => stats.summary.placesEnregistreesDna,
  },
  "activite.placesIndisponibles": {
    bloc: "activite",
    extract: (stats) => stats.summary.placesIndisponibles,
  },
  "activite.placesOccupees": {
    bloc: "activite",
    extract: (stats) => stats.summary.placesOccupees,
  },
  "activite.presencesIndues": {
    bloc: "activite",
    extract: (stats) => stats.summary.presencesInduesTotal,
  },
};

export type CartographieIndicateurValues = {
  value: number | null;
  previousValue: number | null;
};

/**
 * Calcule le bloc de statistiques concerné par l'indicateur (un seul, pas les 5)
 * et en extrait la valeur de `annee` et `annee - 1`. Pour le bloc `activite`,
 * `previousValue` est toujours `null` (pas d'agrégation par année civile pour
 * l'instant, cf. README du dossier).
 */
export const computeIndicateurValues = (
  context: StatistiquesContext,
  indicateur: CartographieIndicateur,
  annee: number,
  aggregation: NumericAggregation
): CartographieIndicateurValues => {
  const entry = INDICATEUR_REGISTRY[indicateur];

  switch (entry.bloc) {
    case "structures": {
      const stats = computeStructuresStatistiques(context);
      return {
        value: entry.extract(stats, annee),
        previousValue: entry.extract(stats, annee - 1),
      };
    }
    case "places": {
      const stats = computePlacesStatistiques(context);
      return {
        value: entry.extract(stats, annee),
        previousValue: entry.extract(stats, annee - 1),
      };
    }
    case "finance": {
      const stats = computeFinanceStatistiques(context, aggregation);
      return {
        value: entry.extract(stats, annee),
        previousValue: entry.extract(stats, annee - 1),
      };
    }
    case "controleQualite": {
      const stats = computeControleQualiteStatistiques(context, aggregation);
      return {
        value: entry.extract(stats, annee),
        previousValue: entry.extract(stats, annee - 1),
      };
    }
    case "activite": {
      const stats = computeActiviteStatistiques(context);
      return {
        value: entry.extract(stats),
        previousValue: null,
      };
    }
  }
};
