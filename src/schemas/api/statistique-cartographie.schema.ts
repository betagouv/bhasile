import { z } from "zod";

import { zSafeYear } from "@/app/utils/zodCustomFields";
import { statistiquesFiltersSchema } from "@/schemas/api/statistique.schema";

const CARTOGRAPHIE_INDICATEURS = [
  "structures.total",
  "structures.avecCpom",
  "places.autorisees",
  "places.pmr",
  "places.lgbt",
  "places.fvvTeh",
  "places.qpv",
  "places.logementsSociaux",
  "finance.dotationAccordee",
  "finance.etp",
  "finance.tauxEncadrement",
  "finance.coutJournalier",
  "finance.resultatNet",
  "controleQualite.nbEig",
  "controleQualite.tauxEigComportementViolent",
  "controleQualite.moyenneEvaluations",
  "activite.placesDna",
  "activite.placesIndisponibles",
  "activite.placesOccupees",
  "activite.presencesIndues",
  "rmu.referesEngages",
  "rmu.referesExecutes",
] as const;

const cartographieIndicateurSchema = z.enum(CARTOGRAPHIE_INDICATEURS);

export type CartographieIndicateur = z.infer<
  typeof cartographieIndicateurSchema
>;

const CARTOGRAPHIE_GRANULARITES = [
  "region",
  "departement",
  "arrondissement",
] as const;

const cartographieGranulariteSchema = z.enum(CARTOGRAPHIE_GRANULARITES);

export type CartographieGranularite = z.infer<
  typeof cartographieGranulariteSchema
>;

/** Granularities actually supported by the computation (arrondissement has no data model yet). */
export type CartographieSupportedGranularite = Exclude<
  CartographieGranularite,
  "arrondissement"
>;

export const statistiqueCartographieFiltersSchema =
  statistiquesFiltersSchema.extend({
    granularite: cartographieGranulariteSchema,
    indicateur: cartographieIndicateurSchema,
    annee: zSafeYear(),
  });

export type StatistiqueCartographieFilters = z.infer<
  typeof statistiqueCartographieFiltersSchema
>;

export type CartographieEvolutionStat = {
  previousValue: number;
  delta: number;
  direction: "hausse" | "baisse" | "stable";
};

export type CartographieZoneStat = {
  code: string;
  name: string;
  value: number | null;
  evolution: CartographieEvolutionStat | null;
};

export type CartographieApiRead = {
  granularite: CartographieSupportedGranularite;
  indicateur: CartographieIndicateur;
  annee: number;
  zones: CartographieZoneStat[];
};

export type CartographieNotImplementedApiRead = {
  error: "NOT_IMPLEMENTED";
  message: string;
};
