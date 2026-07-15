import type { NumericAggregation } from "@/app/utils/math.util";
import { parseCommaList } from "@/app/utils/string.util";
import { FinanceByYearScopeStat } from "@/schemas/api/statistique.schema";
import {
  CartographieEvolutionStat,
  CartographieIndicateur,
  CartographieSupportedGranularite,
  StatistiqueCartographieFilters,
} from "@/schemas/api/statistique-cartographie.schema";

import {
  ActiviteYearField,
  computeActiviteFieldForYears,
} from "../activite/activite.util";
import { computeControleQualiteByYear } from "../controle-qualite/controle-qualite.util";
import { computeFinanceTotalValuesForYears } from "../finance/finance.util";
import {
  computeAdresseFieldForYear,
  computeTypologieFieldForYear,
} from "../places/places.util";
import type {
  StatistiqueDbStructure,
  StatistiquesContext,
} from "../statistiques.db.type";
import { computeStructuresIndicatorForYear } from "../structures/structures.util";
import type { CartographieDbDepartement } from "./cartographie.db.type";

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

export const resolveZoneDepartementNumeros = (
  filters: Pick<StatistiqueCartographieFilters, "departements">
): Set<string> | null => {
  const departementList = parseCommaList(filters.departements);
  return departementList.length > 0 ? new Set(departementList) : null;
};

/** Builds the zone list for the chosen granularite. */
export const buildZoneDefinitions = (
  granularite: CartographieSupportedGranularite,
  allDepartements: CartographieDbDepartement[],
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
    const numeros =
      departementNumerosByRegionCode.get(departement.regionCode) ?? [];
    numeros.push(departement.numero);
    departementNumerosByRegionCode.set(departement.regionCode, numeros);
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

export type CartographieIndicateurValues = {
  value: number | null;
  previousValue: number | null;
};

type IndicateurValuesCalculation = (
  context: StatistiquesContext,
  annee: number,
  aggregation: NumericAggregation
) => CartographieIndicateurValues;

const yearOverPreviousYear =
  (
    compute: (context: StatistiquesContext, year: number) => number | null
  ): IndicateurValuesCalculation =>
  (context, annee) => ({
    value: compute(context, annee),
    previousValue: compute(context, annee - 1),
  });

const financeValuesForYears = (
  context: StatistiquesContext,
  annee: number,
  aggregation: NumericAggregation,
  field: keyof FinanceByYearScopeStat
): CartographieIndicateurValues => {
  const [value, previousValue] = computeFinanceTotalValuesForYears(
    context,
    [annee, annee - 1],
    aggregation,
    field
  );
  return { value, previousValue };
};

const controleQualiteValuesForYears = (
  context: StatistiquesContext,
  annee: number,
  aggregation: NumericAggregation,
  field: "nbEig" | "tauxEigComportementViolent" | "noteGenerale"
): CartographieIndicateurValues => {
  const byYear = computeControleQualiteByYear(context, aggregation);
  const findYear = (year: number) =>
    byYear.find((entry) => entry.date.getUTCFullYear() === year)?.[field] ??
    null;
  return { value: findYear(annee), previousValue: findYear(annee - 1) };
};

const activiteValuesForYears = (
  context: StatistiquesContext,
  annee: number,
  aggregation: NumericAggregation,
  field: ActiviteYearField
): CartographieIndicateurValues => {
  const [value, previousValue] = computeActiviteFieldForYears(
    context,
    [annee, annee - 1],
    aggregation,
    field
  );
  return { value, previousValue };
};

const INDICATEURS: Record<CartographieIndicateur, IndicateurValuesCalculation> =
  {
    "structures.total": yearOverPreviousYear((context, year) =>
      computeStructuresIndicatorForYear(context, year, "totalStructures")
    ),
    "structures.avecCpom": yearOverPreviousYear((context, year) =>
      computeStructuresIndicatorForYear(context, year, "structuresAvecCpom")
    ),
    "places.autorisees": yearOverPreviousYear((context, year) =>
      computeTypologieFieldForYear(context, year, "placesAutorisees")
    ),
    "places.pmr": yearOverPreviousYear((context, year) =>
      computeTypologieFieldForYear(context, year, "pmr")
    ),
    "places.lgbt": yearOverPreviousYear((context, year) =>
      computeTypologieFieldForYear(context, year, "lgbt")
    ),
    "places.fvvTeh": yearOverPreviousYear((context, year) =>
      computeTypologieFieldForYear(context, year, "fvvTeh")
    ),
    "places.qpv": yearOverPreviousYear((context, year) =>
      computeAdresseFieldForYear(context, year, "qpv")
    ),
    "places.logementsSociaux": yearOverPreviousYear((context, year) =>
      computeAdresseFieldForYear(context, year, "logementSocial")
    ),
    "finance.dotationAccordee": (context, annee, aggregation) =>
      financeValuesForYears(context, annee, aggregation, "dotationAccordee"),
    "finance.etp": (context, annee, aggregation) =>
      financeValuesForYears(context, annee, aggregation, "totalETP"),
    "finance.tauxEncadrement": (context, annee, aggregation) =>
      financeValuesForYears(context, annee, aggregation, "tauxEncadrement"),
    "finance.coutJournalier": (context, annee, aggregation) =>
      financeValuesForYears(context, annee, aggregation, "coutJournalier"),
    "finance.resultatNet": (context, annee, aggregation) =>
      financeValuesForYears(context, annee, aggregation, "resultatNet"),
    "controleQualite.nbEig": (context, annee, aggregation) =>
      controleQualiteValuesForYears(context, annee, aggregation, "nbEig"),
    "controleQualite.tauxEigComportementViolent": (
      context,
      annee,
      aggregation
    ) =>
      controleQualiteValuesForYears(
        context,
        annee,
        aggregation,
        "tauxEigComportementViolent"
      ),
    "controleQualite.moyenneEvaluations": (context, annee, aggregation) =>
      controleQualiteValuesForYears(
        context,
        annee,
        aggregation,
        "noteGenerale"
      ),
    "activite.placesDna": (context, annee, aggregation) =>
      activiteValuesForYears(
        context,
        annee,
        aggregation,
        "placesEnregistreesDna"
      ),
    "activite.placesIndisponibles": (context, annee, aggregation) =>
      activiteValuesForYears(
        context,
        annee,
        aggregation,
        "placesIndisponibles"
      ),
    "activite.placesOccupees": (context, annee, aggregation) =>
      activiteValuesForYears(context, annee, aggregation, "placesOccupees"),
    "activite.presencesIndues": (context, annee, aggregation) =>
      activiteValuesForYears(
        context,
        annee,
        aggregation,
        "presencesInduesTotal"
      ),
  };

/** Computes only the requested indicator, for `annee` and `annee - 1`. */
export const computeIndicateurValues = (
  context: StatistiquesContext,
  indicateur: CartographieIndicateur,
  annee: number,
  aggregation: NumericAggregation
): CartographieIndicateurValues =>
  INDICATEURS[indicateur](context, annee, aggregation);
