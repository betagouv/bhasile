import { z } from "zod";

import type { NumericAggregation } from "@/app/utils/math.util";

/**
 * Clé stable identifiant un indicateur affichable sur la carte. Chaque clé est
 * reliée à un champ précis de `StatistiqueApiRead` dans `cartographie.util.ts`
 * (`INDICATEUR_EXTRACTORS`) — voir le README du dossier `cartographie/` pour le
 * détail du mapping et les indicateurs volontairement absents.
 */
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

export type CartographieIndicateur = z.infer<typeof cartographieIndicateurSchema>;

export const CARTOGRAPHIE_GRANULARITES = [
  "region",
  "departement",
  "arrondissement",
] as const;

export const cartographieGranulariteSchema = z.enum(CARTOGRAPHIE_GRANULARITES);

export type CartographieGranularite = z.infer<
  typeof cartographieGranulariteSchema
>;

/** Granularités effectivement supportées côté calcul (l'arrondissement n'existe pas en base, cf. route.ts). */
export type CartographieSupportedGranularite = Exclude<
  CartographieGranularite,
  "arrondissement"
>;

export const statistiqueCartographieFiltersSchema = z.object({
  granularite: cartographieGranulariteSchema,
  indicateur: cartographieIndicateurSchema,
  annee: z.coerce.number().int(),
  departements: z.string().nullable(),
  regions: z.string().nullable(),
  operateurs: z.string().nullable(),
  types: z.string().nullable(),
  aggregation: z
    .string()
    .nullable()
    .transform(
      (value): NumericAggregation =>
        value === "mediane" ? "mediane" : "moyenne"
    ),
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
  /** `null` quand l'évolution n'est pas calculable pour cet indicateur (cf. `CARTOGRAPHIE_INDICATEURS_SANS_EVOLUTION`) ou pour l'année N-1 (pas de donnée). */
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
