import type { NumericAggregation } from "@/app/utils/math.util";
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

/** Resolves the departements/regions CSV filters into a set of departement numeros, or null if unrestricted. */
export const resolveZoneDepartementNumeros = (
  filters: Pick<StatistiqueCartographieFilters, "departements" | "regions">,
  allDepartements: CartographieDbDepartement[]
): Set<string> | null => {
  const departementList =
    filters.departements?.split(",").filter(Boolean) ?? [];
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

  // Both filters given: intersect them.
  const departementsFromRegionsSet = new Set(departementsFromRegions);
  return new Set(
    departementList.filter((numero) => departementsFromRegionsSet.has(numero))
  );
};

/** Builds the canonical zone list for the chosen granularite, including zones with no structure. */
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
    const numeros =
      departementNumerosByRegionCode.get(departement.regionCode) ?? [];
    numeros.push(departement.numero);
    departementNumerosByRegionCode.set(departement.regionCode, numeros);
  }

  // Unrestricted: also include regions with no departement attached.
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
  "structures.total": (context, annee) => ({
    value: computeStructuresIndicatorForYear(context, annee, "totalStructures"),
    previousValue: computeStructuresIndicatorForYear(
      context,
      annee - 1,
      "totalStructures"
    ),
  }),
  "structures.avecCpom": (context, annee) => ({
    value: computeStructuresIndicatorForYear(
      context,
      annee,
      "structuresAvecCpom"
    ),
    previousValue: computeStructuresIndicatorForYear(
      context,
      annee - 1,
      "structuresAvecCpom"
    ),
  }),
  "places.autorisees": (context, annee) => ({
    value: computeTypologieFieldForYear(context, annee, "placesAutorisees"),
    previousValue: computeTypologieFieldForYear(
      context,
      annee - 1,
      "placesAutorisees"
    ),
  }),
  "places.pmr": (context, annee) => ({
    value: computeTypologieFieldForYear(context, annee, "pmr"),
    previousValue: computeTypologieFieldForYear(context, annee - 1, "pmr"),
  }),
  "places.lgbt": (context, annee) => ({
    value: computeTypologieFieldForYear(context, annee, "lgbt"),
    previousValue: computeTypologieFieldForYear(context, annee - 1, "lgbt"),
  }),
  "places.fvvTeh": (context, annee) => ({
    value: computeTypologieFieldForYear(context, annee, "fvvTeh"),
    previousValue: computeTypologieFieldForYear(context, annee - 1, "fvvTeh"),
  }),
  "places.qpv": (context, annee) => ({
    value: computeAdresseFieldForYear(context, annee, "qpv"),
    previousValue: computeAdresseFieldForYear(context, annee - 1, "qpv"),
  }),
  "places.logementsSociaux": (context, annee) => ({
    value: computeAdresseFieldForYear(context, annee, "logementSocial"),
    previousValue: computeAdresseFieldForYear(
      context,
      annee - 1,
      "logementSocial"
    ),
  }),
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
