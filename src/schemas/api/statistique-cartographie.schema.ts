import { z } from "zod";

import { statistiquesFiltersSchema } from "@/schemas/api/statistique.schema";

/** Stable indicator keys shown on the map; see the cartographie/ README for the full mapping. */
export const CARTOGRAPHIE_INDICATEURS = [
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
] as const;

export const cartographieIndicateurSchema = z.enum(CARTOGRAPHIE_INDICATEURS);

export type CartographieIndicateur = z.infer<
  typeof cartographieIndicateurSchema
>;

export const CARTOGRAPHIE_GRANULARITES = [
  "region",
  "departement",
  "arrondissement",
] as const;

export const cartographieGranulariteSchema = z.enum(CARTOGRAPHIE_GRANULARITES);

export type CartographieGranularite = z.infer<
  typeof cartographieGranulariteSchema
>;

/** Granularities actually supported by the computation (arrondissement has no data model yet). */
export type CartographieSupportedGranularite = Exclude<
  CartographieGranularite,
  "arrondissement"
>;

export const statistiqueCartographieFiltersSchema = statistiquesFiltersSchema.extend({
  granularite: cartographieGranulariteSchema,
  indicateur: cartographieIndicateurSchema,
  annee: z.coerce.number().int(),
});

export type StatistiqueCartographieFilters = z.infer<
  typeof statistiqueCartographieFiltersSchema
>;

// Types de lecture pure (pas d'input à valider) : pas de schéma zod, juste des types.

export type CartographieEvolutionStat = {
  previousValue: number | null;
  delta: number | null;
  direction: "hausse" | "baisse" | "stable" | null;
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
