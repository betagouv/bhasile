import type { NumericAggregation } from "@/app/utils/math.util";
import { parseCommaList } from "@/app/utils/string.util";
import { FinanceByYearScopeStat } from "@/schemas/api/statistique.schema";
import {
  CartographieEvolutionStat,
  CartographieIndicateur,
  CartographieSupportedGranularite,
  StatistiqueCartographieFilters,
} from "@/schemas/api/statistique-cartographie.schema";

import { computeActiviteSummary } from "../activite/activite.util";
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
import type { CartographieDbDepartement } from "./cartographie.repository";

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

/** Resolves the `departements` filter into a set of departement numeros, or null if unrestricted. */
export const resolveZoneDepartementNumeros = (
  filters: Pick<StatistiqueCartographieFilters, "departements">
): Set<string> | null => {
  const departementList = parseCommaList(filters.departements);
  return departementList.length > 0 ? new Set(departementList) : null;
};

/** Builds the canonical zone list for the chosen granularite, including zones with no structure. */
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

/** One lean computer per indicator; `aggregation` (moyenne/médiane) is unrelated to `granularite` (region/departement). */
type IndicateurValuesComputer = (
  context: StatistiquesContext,
  annee: number,
  aggregation: NumericAggregation
) => CartographieIndicateurValues;

/** Wraps a single-year compute function into a value/previousValue pair for `annee` and `annee - 1`. */
const yearOverYear =
  (
    compute: (context: StatistiquesContext, year: number) => number | null
  ): IndicateurValuesComputer =>
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

/** Activite has no yearly aggregation yet, so this returns the current snapshot with no evolution. TODO. */
const activiteSnapshotValue = (
  context: StatistiquesContext,
  field:
    | "placesEnregistreesDna"
    | "placesIndisponibles"
    | "placesOccupees"
    | "presencesInduesTotal"
): CartographieIndicateurValues => ({
  value: computeActiviteSummary(context)[field],
  previousValue: null,
});

export const INDICATEUR_COMPUTERS: Record<
  CartographieIndicateur,
  IndicateurValuesComputer
> = {
  "structures.total": yearOverYear((context, year) =>
    computeStructuresIndicatorForYear(context, year, "totalStructures")
  ),
  "structures.avecCpom": yearOverYear((context, year) =>
    computeStructuresIndicatorForYear(context, year, "structuresAvecCpom")
  ),
  "places.autorisees": yearOverYear((context, year) =>
    computeTypologieFieldForYear(context, year, "placesAutorisees")
  ),
  "places.pmr": yearOverYear((context, year) =>
    computeTypologieFieldForYear(context, year, "pmr")
  ),
  "places.lgbt": yearOverYear((context, year) =>
    computeTypologieFieldForYear(context, year, "lgbt")
  ),
  "places.fvvTeh": yearOverYear((context, year) =>
    computeTypologieFieldForYear(context, year, "fvvTeh")
  ),
  "places.qpv": yearOverYear((context, year) =>
    computeAdresseFieldForYear(context, year, "qpv")
  ),
  "places.logementsSociaux": yearOverYear((context, year) =>
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
  "controleQualite.tauxEigComportementViolent": (context, annee, aggregation) =>
    controleQualiteValuesForYears(
      context,
      annee,
      aggregation,
      "tauxEigComportementViolent"
    ),
  "controleQualite.moyenneEvaluations": (context, annee, aggregation) =>
    controleQualiteValuesForYears(context, annee, aggregation, "noteGenerale"),
  "activite.placesDna": (context) =>
    activiteSnapshotValue(context, "placesEnregistreesDna"),
  "activite.placesIndisponibles": (context) =>
    activiteSnapshotValue(context, "placesIndisponibles"),
  "activite.placesOccupees": (context) =>
    activiteSnapshotValue(context, "placesOccupees"),
  "activite.presencesIndues": (context) =>
    activiteSnapshotValue(context, "presencesInduesTotal"),
};

/** Computes only the requested indicator, for `annee` and `annee - 1`. */
export const computeIndicateurValues = (
  context: StatistiquesContext,
  indicateur: CartographieIndicateur,
  annee: number,
  aggregation: NumericAggregation
): CartographieIndicateurValues =>
  INDICATEUR_COMPUTERS[indicateur](context, annee, aggregation);
