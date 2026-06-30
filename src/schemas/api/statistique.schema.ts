import z from "zod";

import type { NumericAggregation } from "@/app/utils/math.util";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

export type StatistiquesAggregation = NumericAggregation;

export const statistiquesFiltersSchema = z.object({
  departements: z.string().nullable(),
  operateurs: z.string().nullable(),
  types: z.string().nullable(),
  aggregation: z
    .string()
    .nullable()
    .transform(
      (value): NumericAggregation => (value === "mediane" ? "mediane" : "moyenne")
    ),
});

export type StatistiquesFilters = z.infer<typeof statistiquesFiltersSchema>;

export type TypeStructureStat = {
  type: StructureType;
  structures: number;
  places: number;
};

export type BatiStat = {
  bati: Repartition;
  structures: number;
  places: number;
};

/** Séries annuelles : décomptes de structures uniquement (pas de places). */
export type StructuresByYearStat = {
  year: number;
  totalStructures: number;
  totalCpoms: number;
  structuresCada: number;
  structuresCph: number;
  structuresHuda: number;
  structuresCaes: number;
  structuresBatiCollectif: number;
  structuresBatiDiffus: number;
  structuresBatiMixte: number;
};

export type PlacesByYearStat = {
  year: number;
  totalPlaces: number;
  population: number | null;
  /** Ratio places / population, ou `null` si population absente. */
  tauxEquipement: number | null;
  pmr: number;
  lgbt: number;
  fvvTeh: number;
  qpv: number;
  logementsSociaux: number;
};

export type FinanceByYearScopeStat = {
  dotationDemandee: number;
  dotationAccordee: number;
  totalETP: number;
  tauxEncadrement: number | null;
  coutJournalier: number | null;
  totalProduits: number;
  totalCharges: number;
  resultatNet: number;
  excedentCumule: number;
  deficitCumule: number;
  soldeCumule: number;
};

export type FinanceByYearStat = {
  year: number;
  total: FinanceByYearScopeStat;
  autorisees: FinanceByYearScopeStat;
  subventionnees: FinanceByYearScopeStat;
};

export type ActiviteMotifsIndisponibiliteStat = {
  desinsectisation: number;
  remiseEnEtat: number;
  sousOccupation: number;
  travaux: number;
};

export type ActiviteSummaryStat = {
  placesEnregistreesDna: number;
  placesIndisponibles: number;
  placesDisponibles: number;
  tauxIndisponibilite: number | null;
  motifsIndisponibilite: ActiviteMotifsIndisponibiliteStat;
  presencesInduesBPI: number;
  tauxPresencesInduesBPI: number | null;
  presencesInduesDeboutees: number;
  tauxPresencesInduesDeboutees: number | null;
  presencesInduesTotal: number;
  tauxPresencesInduesTotal: number | null;
};

export type ActiviteByMonthStat = {
  date: Date;
  placesEnregistreesDna: number;
  placesIndisponibles: number;
  tauxIndisponibilite: number | null;
  presencesInduesBPI: number;
  tauxPresencesInduesBPI: number | null;
  presencesInduesDeboutees: number;
  tauxPresencesInduesDeboutees: number | null;
  presencesInduesTotal: number;
  tauxPresencesInduesTotal: number | null;
};

const typeStructureStatSchema = z.object({
  type: z.nativeEnum(StructureType),
  structures: z.number(),
  places: z.number(),
});

const batiStatSchema = z.object({
  bati: z.nativeEnum(Repartition),
  structures: z.number(),
  places: z.number(),
});

const placesIndicatorsSchema = z.object({
  totalPlaces: z.number(),
  population: z.number().nullable(),
  tauxEquipement: z.number().nullable(),
  pmr: z.number(),
  lgbt: z.number(),
  fvvTeh: z.number(),
  qpv: z.number(),
  logementsSociaux: z.number(),
});

const placesByYearStatSchema = placesIndicatorsSchema.extend({
  year: z.number(),
});

const financeByYearScopeStatSchema = z.object({
  dotationDemandee: z.number(),
  dotationAccordee: z.number(),
  totalETP: z.number(),
  tauxEncadrement: z.number().nullable(),
  coutJournalier: z.number().nullable(),
  totalProduits: z.number(),
  totalCharges: z.number(),
  resultatNet: z.number(),
  excedentCumule: z.number(),
  deficitCumule: z.number(),
  soldeCumule: z.number(),
});

const financeByYearStatSchema = z.object({
  year: z.number(),
  total: financeByYearScopeStatSchema,
  autorisees: financeByYearScopeStatSchema,
  subventionnees: financeByYearScopeStatSchema,
});

const eigCountTotalsStatSchema = z.object({
  nbEig: z.number(),
  nbEigComportementViolent: z.number(),
});

const eigCountsStatSchema = eigCountTotalsStatSchema.extend({
  tauxEigComportementViolent: z.number().nullable(),
});

const eigRatesStatSchema = eigCountsStatSchema.extend({
  tauxEig: z.number().nullable(),
});

const controleQualiteEvaluationSummaryStatSchema = z.object({
  moyenneEvaluationsCurrentYear: z.number().nullable(),
});

const eigStatSchema = eigRatesStatSchema.merge(
  controleQualiteEvaluationSummaryStatSchema
);

const eigPeriodDeclarationStatSchema = z.object({
  nbStructuresSansDeclarationEig: z.number(),
  partStructuresSansDeclarationEig: z.number().nullable(),
});

const eigPeriodStatSchema = eigPeriodDeclarationStatSchema.merge(
  eigCountsStatSchema
);

const controleQualiteEvaluationStatSchema = z.object({
  nbStructuresEvaluees: z.number(),
  noteGenerale: z.number().nullable(),
  notePersonne: z.number().nullable(),
  notePro: z.number().nullable(),
  noteStructure: z.number().nullable(),
});

const controleQualitePeriodBaseSchema = eigPeriodStatSchema.merge(
  controleQualiteEvaluationStatSchema
);

const controleQualiteByMonthStatSchema = controleQualitePeriodBaseSchema.merge(
  z.object({ date: z.coerce.date() })
);

const controleQualiteByTrimesterStatSchema =
  controleQualitePeriodBaseSchema.merge(
    z.object({
      year: z.number(),
      trimester: z.number(),
    })
  );

const controleQualiteByYearStatSchema = controleQualitePeriodBaseSchema.merge(
  z.object({ year: z.number() })
);

export type EigCountTotalsStat = z.infer<typeof eigCountTotalsStatSchema>;
export type EigCountsStat = z.infer<typeof eigCountsStatSchema>;
export type EigRatesStat = z.infer<typeof eigRatesStatSchema>;
export type ControleQualiteEvaluationSummaryStat = z.infer<
  typeof controleQualiteEvaluationSummaryStatSchema
>;
export type EigStat = z.infer<typeof eigStatSchema>;
export type EigPeriodDeclarationStat = z.infer<
  typeof eigPeriodDeclarationStatSchema
>;
export type EigPeriodStat = z.infer<typeof eigPeriodStatSchema>;
export type ControleQualiteEvaluationStat = z.infer<
  typeof controleQualiteEvaluationStatSchema
>;
export type ControleQualitePeriodBase = z.infer<
  typeof controleQualitePeriodBaseSchema
>;
export type ControleQualiteByMonthStat = z.infer<
  typeof controleQualiteByMonthStatSchema
>;
export type ControleQualiteByTrimesterStat = z.infer<
  typeof controleQualiteByTrimesterStatSchema
>;
export type ControleQualiteByYearStat = z.infer<
  typeof controleQualiteByYearStatSchema
>;

const activiteMotifsIndisponibiliteStatSchema = z.object({
  desinsectisation: z.number(),
  remiseEnEtat: z.number(),
  sousOccupation: z.number(),
  travaux: z.number(),
});

const activiteSummaryStatSchema = z.object({
  placesEnregistreesDna: z.number(),
  placesIndisponibles: z.number(),
  placesDisponibles: z.number(),
  tauxIndisponibilite: z.number().nullable(),
  motifsIndisponibilite: activiteMotifsIndisponibiliteStatSchema,
  presencesInduesBPI: z.number(),
  tauxPresencesInduesBPI: z.number().nullable(),
  presencesInduesDeboutees: z.number(),
  tauxPresencesInduesDeboutees: z.number().nullable(),
  presencesInduesTotal: z.number(),
  tauxPresencesInduesTotal: z.number().nullable(),
});

const activiteByMonthStatSchema = z.object({
  date: z.coerce.date(),
  placesEnregistreesDna: z.number(),
  placesIndisponibles: z.number(),
  tauxIndisponibilite: z.number().nullable(),
  presencesInduesBPI: z.number(),
  tauxPresencesInduesBPI: z.number().nullable(),
  presencesInduesDeboutees: z.number(),
  tauxPresencesInduesDeboutees: z.number().nullable(),
  presencesInduesTotal: z.number(),
  tauxPresencesInduesTotal: z.number().nullable(),
});

const structuresByYearStatSchema = z.object({
  year: z.number(),
  totalStructures: z.number(),
  totalCpoms: z.number(),
  structuresCada: z.number(),
  structuresCph: z.number(),
  structuresHuda: z.number(),
  structuresCaes: z.number(),
  structuresBatiCollectif: z.number(),
  structuresBatiDiffus: z.number(),
  structuresBatiMixte: z.number(),
});

export const statistiqueApiReadSchema = z.object({
  structures: z.object({
    totalStructures: z.number(),
    totalCpoms: z.number(),
    structuresAvecCpom: z.number(),
    structureTypes: z.array(typeStructureStatSchema),
    structureBatis: z.array(batiStatSchema),
    byYear: z.array(structuresByYearStatSchema),
  }),
  places: placesIndicatorsSchema.extend({
    byYear: z.array(placesByYearStatSchema),
  }),
  finance: z.object({
    byYear: z.array(financeByYearStatSchema),
  }),
  controleQualite: z.object({
    eig: eigStatSchema,
    byMonth: z.array(controleQualiteByMonthStatSchema),
    byTrimester: z.array(controleQualiteByTrimesterStatSchema),
    byYear: z.array(controleQualiteByYearStatSchema),
  }),
  activite: z.object({
    summary: activiteSummaryStatSchema,
    byMonth: z.array(activiteByMonthStatSchema),
  }),
});

export type StatistiqueApiRead = z.infer<typeof statistiqueApiReadSchema>;
export type StatistiqueApiResponse = StatistiqueApiRead | null;
