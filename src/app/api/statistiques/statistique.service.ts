import { getYearFromDate } from "@/app/utils/date.util";
import { average, sumValues } from "@/app/utils/math.util";
import { Prisma, Repartition, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { STRUCTURE_TYPES_DISPLAY_ORDER } from "@/types/structure.type";

import {
  StatistiqueDbActivite,
  StatistiqueDbAdresse,
  StatistiqueDbBudgetAgg,
  StatistiqueDbDepartement,
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
  StatistiqueDbIndicateurMedianByType,
  StatistiqueDbIndicateurMedianByYearAndType,
  StatistiqueDbIndicateurMedianGlobal,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbIndicateurMedian,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./statistique.db.type";
import {
  buildStructureBatisStats,
  buildStructureTypesStats,
  getBatiPerStructure,
  getLastTypologiePerStructure,
  sortByDefinedOrder,
} from "./statistique.util";
import {
  countCpoms,
  findActivites,
  findCpomStructures,
  findBudgetsByYear,
  findDepartementsWithPopulation,
  findDnaLinksByStructure,
  findEigs,
  findEvaluations,
  findGlobalMedianIndicateurs,
  findGlobalMedianIndicateursByType,
  findIndicateursFinanciers,
  findLatestActivites,
  findYearlyMedianIndicateurs,
  findYearlyMedianIndicateursByType,
  findStructureAdresses,
  findStructureIds,
  findStructuresWithTypes,
  findStructureTypologies,
} from "./statistique.repository";
import {
  ActiviteStat,
  BatiStat,
  EigStat,
  EvaluationStat,
  FinanceMedianByType,
  FinanceStat,
  FinanceStatByYear,
  PlacesSpecialesStat,
  StatistiqueApiRead,
  StatistiquesFiltersRaw,
  TauxEquipementDept,
  TypeStructureStat,
  YearStat,
} from "@/schemas/api/statistique.schema";

const aggregateStructuresByKey = <Key>(
  structures: StatistiqueDbStructure[],
  lastTypologieMap: Map<number, StatistiqueDbTypologie>,
  getKey: (structure: StatistiqueDbStructure) => Key
): Map<Key, { structures: number; places: number }> => {
  const map = new Map<Key, { structures: number; places: number }>();
  for (const structure of structures) {
    const typologie = lastTypologieMap.get(structure.id);
    const key = getKey(structure);
    const current = map.get(key) ?? { structures: 0, places: 0 };
    map.set(key, {
      structures: current.structures + 1,
      places: current.places + (typologie?.placesAutorisees ?? 0),
    });
  }
  return map;
};

const computeTypeStats = (
  structures: StatistiqueDbStructure[],
  lastTypologieMap: Map<number, StatistiqueDbTypologie>
): TypeStructureStat[] =>
  Array.from(
    aggregateStructuresByKey(
      structures,
      lastTypologieMap,
      (structure) => structure.type
    ).entries()
  ).map(([type, stats]) => ({ type, ...stats }));

const computeBatiStats = (
  structures: StatistiqueDbStructure[],
  batiMap: Map<number, Repartition>,
  lastTypologieMap: Map<number, StatistiqueDbTypologie>
): BatiStat[] =>
  Array.from(
    aggregateStructuresByKey(
      structures,
      lastTypologieMap,
      (structure) => batiMap.get(structure.id) ?? Repartition.COLLECTIF
    ).entries()
  ).map(([bati, stats]) => ({ bati, ...stats }));

const computePlacesSpeciales = (
  structures: StatistiqueDbStructure[],
  lastTypologieMap: Map<number, StatistiqueDbTypologie>,
  adresses: StatistiqueDbAdresse[]
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

const computeYearStats = (
  typologies: StatistiqueDbTypologie[],
  structures: StatistiqueDbStructure[],
  adresses: StatistiqueDbAdresse[],
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

const buildMediansByType = (
  rows: StatistiqueDbIndicateurMedianByType[],
  types: StructureType[]
): FinanceMedianByType[] =>
  types.map((type) => {
    const row = rows.find((entry) => entry.type === type);
    return {
      type,
      tauxEncadrementMedian: row?.tauxEncadrementMedian ?? null,
      coutJournalierMedian: row?.coutJournalierMedian ?? null,
    };
  });

const getFinanceTypes = (structures: StatistiqueDbStructure[]): StructureType[] =>
  sortByDefinedOrder(
    structures
      .map((structure) => structure.type)
      .filter((type): type is StructureType => type !== null),
    STRUCTURE_TYPES_DISPLAY_ORDER as StructureType[]
  );

const computeFinanceByYear = (
  budgets: StatistiqueDbBudgetAgg[],
  indicateurs: StatistiqueDbIndicateurFinancier[],
  medians: StatistiqueDbIndicateurMedian[],
  mediansByType: StatistiqueDbIndicateurMedianByYearAndType[],
  financeTypes: StructureType[]
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
      byType: buildMediansByType(
        mediansByType.filter((entry) => entry.year === year),
        financeTypes
      ),
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
  globalMedian: StatistiqueDbIndicateurMedianGlobal,
  globalMediansByType: StatistiqueDbIndicateurMedianByType[],
  financeTypes: StructureType[]
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
  byType: buildMediansByType(globalMediansByType, financeTypes),
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

const computeEvaluationStat = (
  evaluations: StatistiqueDbEvaluation[],
  year?: number
): EvaluationStat => {
  const filtered = year
    ? evaluations.filter(
        (evaluation) =>
          evaluation.date && getYearFromDate(evaluation.date) === year
      )
    : evaluations;
  return {
    year,
    nbEvaluations: filtered.length,
    moyenneGenerale: average(filtered.map((evaluation) => evaluation.note)),
    moyennePersonne: average(
      filtered.map((evaluation) => evaluation.notePersonne)
    ),
    moyennePro: average(filtered.map((evaluation) => evaluation.notePro)),
    moyenneStructure: average(
      filtered.map((evaluation) => evaluation.noteStructure)
    ),
  };
};

const isEigComportementViolent = (type: string): boolean =>
  type.toLowerCase().includes("comportement violent");

const computeEigStat = (
  eigs: StatistiqueDbEig[],
  dnaLinks: StatistiqueDbDnaLink[],
  structureIds: number[],
  totalPlaces: number
): EigStat => {
  const nbComportementViolent = eigs.filter((eig) =>
    isEigComportementViolent(eig.type)
  ).length;
  const nbAutres = eigs.length - nbComportementViolent;
  const dnaCodesWithEig = new Set(eigs.map((eig) => eig.dnaCode));
  const structureIdsWithEig = new Set<number>();

  for (const link of dnaLinks) {
    if (link.structureId !== null && dnaCodesWithEig.has(link.dna.code)) {
      structureIdsWithEig.add(link.structureId);
    }
  }

  return {
    pour1000PlacesSur12Mois:
      totalPlaces > 0 ? (eigs.length / totalPlaces) * 1000 : null,
    tauxComportementViolent:
      eigs.length > 0 ? nbComportementViolent / eigs.length : null,
    nbComportementViolent,
    nbAutres,
    nbStructuresSansDeclaration:
      structureIds.length - structureIdsWithEig.size,
  };
};

const computeActiviteStat = (
  latest: StatistiqueDbActivite[],
  timeSeries: StatistiqueDbActivite[]
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
  structures: StatistiqueDbStructure[],
  lastTypologieMap: Map<number, StatistiqueDbTypologie>,
  departements: StatistiqueDbDepartement[]
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

const buildStructureWhere = async (
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

export const getStatistiques = async (
  filters: StatistiquesFiltersRaw
): Promise<StatistiqueApiRead> => {
  // TODO: exposer meta.updatedAt par bloc (campagne actualisation, OFII, instant T)
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
    globalMediansByType,
    mediansByYearAndType,
    dnaLinks,
    evaluations,
  ] = await Promise.all([
    countCpoms(structureIds),
    findStructuresWithTypes(structureIds),
    findStructureTypologies(structureIds),
    findStructureAdresses(structureIds),
    findCpomStructures(structureIds),
    findBudgetsByYear(structureIds),
    findIndicateursFinanciers(structureIds),
    findYearlyMedianIndicateurs(structureIds),
    findGlobalMedianIndicateurs(structureIds),
    findGlobalMedianIndicateursByType(structureIds),
    findYearlyMedianIndicateursByType(structureIds),
    findDnaLinksByStructure(structureIds),
    findEvaluations(structureIds),
  ]);

  const dnaCodes = [...new Set(dnaLinks.map((link) => link.dna.code))];

  const [eigs, latestActivites, activitesTimeSeries] = await Promise.all([
    findEigs(dnaCodes, twelveMonthsAgo),
    findLatestActivites(dnaCodes),
    findActivites(dnaCodes),
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
  const totalPlaces =
    sumValues(
      structures.map(
        (structure) => lastTypologieMap.get(structure.id)?.placesAutorisees
      )
    ) ?? 0;

  const tauxEquipement = computeTauxEquipement(
    structures,
    lastTypologieMap,
    departements
  );

  const financeTypes = getFinanceTypes(structures);
  const financeByYear = computeFinanceByYear(
    budgets,
    indicateurs,
    mediansByYear,
    mediansByYearAndType,
    financeTypes
  );
  const finance = aggregateFinanceStat(
    financeByYear,
    globalMedian,
    globalMediansByType,
    financeTypes
  );

  const eig = computeEigStat(eigs, dnaLinks, structureIds, totalPlaces);

  const evalYears = [
    ...new Set(
      evaluations
        .map((evaluation) =>
          evaluation.date ? getYearFromDate(evaluation.date) : null
        )
        .filter((year): year is number => year !== null)
    ),
  ].sort((yearA, yearB) => yearA - yearB);

  const evaluationsByYear = evalYears.map((year) =>
    computeEvaluationStat(evaluations, year)
  );

  const activites = computeActiviteStat(latestActivites, activitesTimeSeries);

  const structureTypes = buildStructureTypesStats(
    byYear,
    structures,
    typologies,
    cpomLinks
  );
  const structureBatis = buildStructureBatisStats(
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
    eig,
    evaluationsByYear,
    activites,
  };
};

const emptyResult = (): StatistiqueApiRead => ({
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
    byType: [],
    totalProduits: 0,
    totalCharges: 0,
    excedents: 0,
    deficits: 0,
    resultatNet: 0,
  },
  financeByYear: [],
  eig: {
    pour1000PlacesSur12Mois: null,
    tauxComportementViolent: null,
    nbComportementViolent: 0,
    nbAutres: 0,
    nbStructuresSansDeclaration: 0,
  },
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
