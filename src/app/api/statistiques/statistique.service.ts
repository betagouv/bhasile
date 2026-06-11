import { sumValues } from "@/app/utils/math.util";
import { Prisma, Repartition, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

import {
  ActiviteRow,
  AdresseRow,
  BudgetAggRow,
  DepartementRow,
  EvaluationRow,
  GlobalMedianRow,
  IndicateurRow,
  MedianRow,
  StructureRow,
  TypologieRow,
} from "./statistique.db.type";
import {
  buildStructureBatisPivot,
  buildStructureTypesPivot,
} from "./statistique.util";
import {
  countCpoms,
  findActivitesTimeSeries,
  findCpomStructures,
  findBudgetsByYear,
  findDepartementsWithPopulation,
  findDnaCodes,
  findEigs,
  findEvaluations,
  findGlobalMedianIndicateurs,
  findIndicateursFinanciers,
  findLatestActivitesPerDna,
  findMedianIndicateursByYear,
  findStructureAdresses,
  findStructureIds,
  findStructuresWithTypes,
  findStructureTypologies,
} from "./statistique.repository";
import {
  ActiviteStat,
  BatiStat,
  EvaluationStat,
  FinanceStat,
  FinanceStatByYear,
  PlacesSpecialesStat,
  StatistiquesApiType,
  StatistiquesFiltersRaw,
  TauxEquipementDept,
  TypeStructureStat,
  YearStat,
} from "@/schemas/api/statistique.schema";

/**
 * Retourne la dernière typologie valide par structureId.
 */
const getLastTypologiePerStructure = (
  typologies: TypologieRow[]
): Map<number, TypologieRow> => {
  const map = new Map<number, TypologieRow>();
  for (const typologie of typologies) {
    if (typologie.structureId !== null) {
      map.set(typologie.structureId, typologie);
    }
  }
  return map;
};

const getBatiPerStructure = (
  adresses: AdresseRow[]
): Map<number, Repartition> => {
  const byStructure = new Map<number, Repartition[]>();
  for (const adresse of adresses) {
    if (adresse.structureId === null || adresse.repartition === null) {
      continue;
    }
    const list = byStructure.get(adresse.structureId) ?? [];
    list.push(adresse.repartition);
    byStructure.set(adresse.structureId, list);
  }
  const result = new Map<number, Repartition>();
  for (const [structureId, repartitions] of byStructure) {
    const hasDiffus = repartitions.includes(Repartition.DIFFUS);
    const hasCollectif = repartitions.includes(Repartition.COLLECTIF);
    if (hasDiffus && hasCollectif) {
      result.set(structureId, Repartition.MIXTE);
    } else if (hasDiffus) {
      result.set(structureId, Repartition.DIFFUS);
    } else {
      result.set(structureId, Repartition.COLLECTIF);
    }
  }
  return result;
};

const computeTypeStats = (
  structures: StructureRow[],
  lastTypologieMap: Map<number, TypologieRow>
): TypeStructureStat[] => {
  const map = new Map<
    StructureType | null,
    { count: number; places: number }
  >();
  for (const structure of structures) {
    const typologie = lastTypologieMap.get(structure.id);
    const curr = map.get(structure.type) ?? { count: 0, places: 0 };
    map.set(structure.type, {
      count: curr.count + 1,
      places: curr.places + (typologie?.placesAutorisees ?? 0),
    });
  }
  return Array.from(map.entries()).map(([type, { count, places }]) => ({
    type,
    structures: count,
    places,
  }));
};

const computeBatiStats = (
  structures: StructureRow[],
  batiMap: Map<number, Repartition>,
  lastTypologieMap: Map<number, TypologieRow>
): BatiStat[] => {
  const map = new Map<Repartition, { count: number; places: number }>();
  for (const structure of structures) {
    const bati = batiMap.get(structure.id) ?? Repartition.COLLECTIF;
    const typologie = lastTypologieMap.get(structure.id);
    const curr = map.get(bati) ?? { count: 0, places: 0 };
    map.set(bati, {
      count: curr.count + 1,
      places: curr.places + (typologie?.placesAutorisees ?? 0),
    });
  }
  return Array.from(map.entries()).map(([bati, { count, places }]) => ({
    bati,
    structures: count,
    places,
  }));
};

const computePlacesSpeciales = (
  structures: StructureRow[],
  lastTypologieMap: Map<number, TypologieRow>,
  adresses: AdresseRow[]
): PlacesSpecialesStat => {
  let pmr = 0,
    lgbt = 0,
    fvvTeh = 0;
  for (const structure of structures) {
    const typologie = lastTypologieMap.get(structure.id);
    if (!typologie) {
      continue;
    }
    pmr += typologie.pmr ?? 0;
    lgbt += typologie.lgbt ?? 0;
    fvvTeh += typologie.fvvTeh ?? 0;
  }
  const structureIds = new Set(structures.map((structure) => structure.id));
  const logementsSociaux = adresses
    .filter(
      (adresse) =>
        adresse.structureId !== null && structureIds.has(adresse.structureId!)
    )
    .reduce((acc, adresse) => acc + (adresse.logementSocial ?? 0), 0);
  return { pmr, lgbt, fvvTeh, logementsSociaux };
};

const computeTotalPlaces = (
  structures: StructureRow[],
  lastTypologieMap: Map<number, TypologieRow>
): number => {
  let totalPlaces = 0;
  for (const structure of structures) {
    const typologie = lastTypologieMap.get(structure.id);
    if (!typologie) {
      continue;
    }
    totalPlaces += typologie.placesAutorisees ?? 0;
  }
  return totalPlaces;
};

const computeYearStats = (
  typologies: TypologieRow[],
  structures: StructureRow[],
  adresses: AdresseRow[],
  batiMap: Map<number, Repartition>
): YearStat[] => {
  const years = [
    ...new Set(typologies.map((typologie) => typologie.year)),
  ].sort((yearA, yearB) => yearA - yearB);

  return years.map((year) => {
    const lastTypologieMap = getLastTypologiePerStructure(
      typologies.filter((typologie) => typologie.year <= year)
    );
    const relevantStructures = structures.filter((structure) =>
      lastTypologieMap.has(structure.id)
    );
    return {
      year,
      byType: computeTypeStats(relevantStructures, lastTypologieMap),
      byBati: computeBatiStats(relevantStructures, batiMap, lastTypologieMap),
      placesSpeciales: computePlacesSpeciales(
        relevantStructures,
        lastTypologieMap,
        adresses
      ),
    };
  });
};

const computeFinanceByYear = (
  budgets: BudgetAggRow[],
  indicateurs: IndicateurRow[],
  medians: MedianRow[]
): FinanceStatByYear[] => {
  const years = [
    ...new Set([
      ...budgets.map((budget) => budget.year),
      ...indicateurs.map((indicateur) => indicateur.year),
    ]),
  ].sort((yearA, yearB) => yearA - yearB);

  return years.map((year) => {
    const budget = budgets.find((budget) => budget.year === year);
    const indicsForYear = indicateurs.filter(
      (indicateur) => indicateur.year === year
    );
    const median = medians.find((median) => median.year === year);

    const totalETP = indicsForYear.reduce(
      (acc, indicateur) => acc + (indicateur.ETP ?? 0),
      0
    );
    const totalProduits = budget?.totalProduits ?? 0;
    const totalCharges = budget?.totalCharges ?? 0;
    const resultatNet = totalProduits - totalCharges;

    return {
      year,
      totalDotationsDemandees: budget?.dotationDemandee ?? 0,
      totalDotationsAccordees: budget?.dotationAccordee ?? 0,
      totalETP,
      tauxEncadrementMedian: median?.tauxEncadrementMedian ?? null,
      coutJournalierMedian: median?.coutJournalierMedian ?? null,
      totalProduits,
      totalCharges,
      excedents: resultatNet > 0 ? resultatNet : 0,
      deficits: resultatNet < 0 ? Math.abs(resultatNet) : 0,
      resultatNet,
    };
  });
};

const aggregateFinanceStat = (
  byYear: FinanceStatByYear[],
  globalMedian: GlobalMedianRow
): FinanceStat => ({
  totalDotationsDemandees: byYear.reduce(
    (acc, yearStat) => acc + yearStat.totalDotationsDemandees,
    0
  ),
  totalDotationsAccordees: byYear.reduce(
    (acc, yearStat) => acc + yearStat.totalDotationsAccordees,
    0
  ),
  totalETP: byYear.reduce((acc, yearStat) => acc + yearStat.totalETP, 0),
  tauxEncadrementMedian: globalMedian.tauxEncadrementMedian,
  coutJournalierMedian: globalMedian.coutJournalierMedian,
  totalProduits: byYear.reduce(
    (acc, yearStat) => acc + yearStat.totalProduits,
    0
  ),
  totalCharges: byYear.reduce(
    (acc, yearStat) => acc + yearStat.totalCharges,
    0
  ),
  excedents: byYear.reduce((acc, yearStat) => acc + yearStat.excedents, 0),
  deficits: byYear.reduce((acc, yearStat) => acc + yearStat.deficits, 0),
  resultatNet: byYear.reduce((acc, yearStat) => acc + yearStat.resultatNet, 0),
});

const avg = (values: (number | null)[]): number | null => {
  const valid = values.filter((value): value is number => value !== null);
  if (valid.length === 0) {
    return null;
  }
  return (sumValues(valid) ?? 0) / valid.length;
};

const computeEvaluationStat = (
  evaluations: EvaluationRow[],
  year?: number
): EvaluationStat => {
  const filtered = year
    ? evaluations.filter(
        (evaluation) =>
          evaluation.date && new Date(evaluation.date).getFullYear() === year
      )
    : evaluations;
  return {
    year,
    nbEvaluations: filtered.length,
    moyenneGenerale: avg(filtered.map((evaluation) => evaluation.note)),
    moyennePersonne: avg(filtered.map((evaluation) => evaluation.notePersonne)),
    moyennePro: avg(filtered.map((evaluation) => evaluation.notePro)),
    moyenneStructure: avg(
      filtered.map((evaluation) => evaluation.noteStructure)
    ),
  };
};

const computeActiviteStat = (
  latest: ActiviteRow[],
  timeSeries: ActiviteRow[]
): ActiviteStat => {
  const placesAutorisees =
    sumValues(latest.map((activite) => activite.placesAutorisees)) ?? 0;
  const placesIndisponibles =
    sumValues(latest.map((activite) => activite.placesIndisponibles)) ?? 0;

  const byMonth = new Map<
    string,
    { presencesInduesBPI: number; presencesInduesDeboutees: number }
  >();
  for (const activite of timeSeries) {
    const key = new Date(activite.date).toISOString().slice(0, 7);
    const curr = byMonth.get(key) ?? {
      presencesInduesBPI: 0,
      presencesInduesDeboutees: 0,
    };
    byMonth.set(key, {
      presencesInduesBPI:
        curr.presencesInduesBPI + (activite.presencesInduesBPI ?? 0),
      presencesInduesDeboutees:
        curr.presencesInduesDeboutees +
        (activite.presencesInduesDeboutees ?? 0),
    });
  }

  const suivi = Array.from(byMonth.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, val]) => ({ date: new Date(`${key}-01`), ...val }));

  return {
    placesEnregistreesDna: placesAutorisees,
    placesDisponibles: placesAutorisees - placesIndisponibles,
    placesIndisponibles,
    motifsIndisponibilite: {
      desinsectisation:
        sumValues(latest.map((activite) => activite.desinsectisation)) ?? 0,
      remiseEnEtat:
        sumValues(latest.map((activite) => activite.remiseEnEtat)) ?? 0,
      sousOccupation:
        sumValues(latest.map((activite) => activite.sousOccupation)) ?? 0,
      travaux: sumValues(latest.map((activite) => activite.travaux)) ?? 0,
    },
    presencesInduesTotalBPI:
      sumValues(timeSeries.map((activite) => activite.presencesInduesBPI)) ?? 0,
    presencesInduesTotalDeboutees:
      sumValues(
        timeSeries.map((activite) => activite.presencesInduesDeboutees)
      ) ?? 0,
    suivi,
  };
};

const computeTauxEquipement = (
  structures: StructureRow[],
  lastTypologieMap: Map<number, TypologieRow>,
  departements: DepartementRow[]
): TauxEquipementDept[] => {
  const placesByDept = new Map<string, number>();
  for (const structure of structures) {
    if (!structure.departementAdministratif) {
      continue;
    }
    const typologie = lastTypologieMap.get(structure.id);
    placesByDept.set(
      structure.departementAdministratif,
      (placesByDept.get(structure.departementAdministratif) ?? 0) +
        (typologie?.placesAutorisees ?? 0)
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

// ---- Filtres ----

export const buildStructureWhere = async (
  filters: StatistiquesFiltersRaw
): Promise<Prisma.StructureWhereInput> => {
  const where: Prisma.StructureWhereInput = {};

  const typeList = filters.types?.split(",").filter(Boolean) ?? [];
  if (typeList.length > 0) {
    where.type = { in: typeList as StructureType[] };
  }

  const depList = filters.departements?.split(",").filter(Boolean) ?? [];
  if (depList.length > 0) {
    where.departementAdministratif = { in: depList };
  }

  const regionList =
    filters.regions?.split(",").filter(Boolean).map(Number) ?? [];
  if (regionList.length > 0) {
    where.departement = { regionAdministrative: { id: { in: regionList } } };
  }

  const opIds =
    filters.operateurs?.split(",").filter(Boolean).map(Number) ?? [];
  if (opIds.length > 0) {
    const filiales = await prisma.operateur.findMany({
      where: { parentId: { in: opIds } },
      select: { id: true },
    });
    const allOpIds = [
      ...new Set([...opIds, ...filiales.map((filiale) => filiale.id)]),
    ];
    where.operateurId = { in: allOpIds };
  }

  return where;
};

// ---- Point d'entrée ----

export const getStatistiques = async (
  filters: StatistiquesFiltersRaw
): Promise<StatistiquesApiType> => {
  const where = await buildStructureWhere(filters);
  const structureIds = await findStructureIds(where);

  if (structureIds.length === 0) {
    return emptyResult();
  }

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [
    nbCpoms,
    structures,
    typologies,
    adresses,
    cpomLinks,
    budgets,
    indicateurs,
    mediansByYear,
    globalMedian,
    dnaCodes,
    evaluations,
  ] = await Promise.all([
    countCpoms(structureIds),
    findStructuresWithTypes(structureIds),
    findStructureTypologies(structureIds),
    findStructureAdresses(structureIds),
    findCpomStructures(structureIds),
    findBudgetsByYear(structureIds),
    findIndicateursFinanciers(structureIds),
    findMedianIndicateursByYear(structureIds),
    findGlobalMedianIndicateurs(structureIds),
    findDnaCodes(structureIds),
    findEvaluations(structureIds),
  ]);

  const [eigs, latestActivites, activitesTimeSeries] = await Promise.all([
    findEigs(dnaCodes, twelveMonthsAgo),
    findLatestActivitesPerDna(dnaCodes),
    findActivitesTimeSeries(dnaCodes),
  ]);

  const deptNumeros = [
    ...new Set(
      structures
        .map((structure) => structure.departementAdministratif)
        .filter((dept): dept is string => dept !== null)
    ),
  ];
  const departements = await findDepartementsWithPopulation(deptNumeros);

  const lastTypologieMap = getLastTypologiePerStructure(typologies);

  const batiMap = getBatiPerStructure(adresses);

  const byType = computeTypeStats(structures, lastTypologieMap);
  const byBati = computeBatiStats(structures, batiMap, lastTypologieMap);
  const byYear = computeYearStats(typologies, structures, adresses, batiMap);
  const placesSpeciales = computePlacesSpeciales(
    structures,
    lastTypologieMap,
    adresses
  );
  const totalPlaces = computeTotalPlaces(structures, lastTypologieMap);

  const tauxEquipement = computeTauxEquipement(
    structures,
    lastTypologieMap,
    departements
  );

  const financeByYear = computeFinanceByYear(
    budgets,
    indicateurs,
    mediansByYear
  );
  const finance = aggregateFinanceStat(financeByYear, globalMedian);

  const eigPour1000PlacesSur12Mois =
    totalPlaces > 0 ? (eigs.length / totalPlaces) * 1000 : null;
  const eigViolents = eigs.filter((eig) =>
    eig.type.toLowerCase().includes("comportement violent")
  ).length;
  const tauxEigComportementViolent =
    eigs.length > 0 ? eigViolents / eigs.length : null;

  const evalYears = [
    ...new Set(
      evaluations
        .map((evaluation) =>
          evaluation.date ? new Date(evaluation.date).getFullYear() : null
        )
        .filter((year): year is number => year !== null)
    ),
  ].sort((yearA, yearB) => yearA - yearB);

  const evaluationsByYear = evalYears.map((year) =>
    computeEvaluationStat(evaluations, year)
  );

  const activites = computeActiviteStat(latestActivites, activitesTimeSeries);

  const structureTypes = buildStructureTypesPivot(
    byYear,
    structures,
    typologies,
    cpomLinks
  );
  const structureBatis = buildStructureBatisPivot(
    byYear,
    structures,
    typologies,
    adresses,
    cpomLinks
  );

  return {
    totalStructures: structureIds.length,
    totalCpoms: nbCpoms,
    totalPlaces,
    structureTypes,
    structureBatis,
    byType,
    byBati,
    byYear,
    tauxEquipement,
    placesSpeciales,
    finance,
    financeByYear,
    eigPour1000PlacesSur12Mois,
    tauxEigComportementViolent,
    evaluationsByYear,
    activites,
  };
};

const emptyResult = (): StatistiquesApiType => ({
  totalStructures: 0,
  totalCpoms: 0,
  totalPlaces: 0,
  structureTypes: [],
  structureBatis: [],
  byType: [],
  byBati: [],
  byYear: [],
  tauxEquipement: [],
  placesSpeciales: {
    pmr: 0,
    lgbt: 0,
    fvvTeh: 0,
    logementsSociaux: 0,
  },
  finance: {
    totalDotationsDemandees: 0,
    totalDotationsAccordees: 0,
    totalETP: 0,
    tauxEncadrementMedian: null,
    coutJournalierMedian: null,
    totalProduits: 0,
    totalCharges: 0,
    excedents: 0,
    deficits: 0,
    resultatNet: 0,
  },
  financeByYear: [],
  eigPour1000PlacesSur12Mois: null,
  tauxEigComportementViolent: null,
  evaluationsByYear: [],
  activites: {
    placesEnregistreesDna: 0,
    placesDisponibles: 0,
    placesIndisponibles: 0,
    motifsIndisponibilite: {
      desinsectisation: 0,
      remiseEnEtat: 0,
      sousOccupation: 0,
      travaux: 0,
    },
    presencesInduesTotalBPI: 0,
    presencesInduesTotalDeboutees: 0,
    suivi: [],
  },
});
