import { z } from "zod";

import type { NumericAggregation } from "@/app/utils/math.util";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import type { BudgetApiType } from "./budget.schema";

export type StatistiquesAggregation = NumericAggregation;

export const statistiquesFiltersSchema = z.object({
  departements: z.string().nullable(),
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

export type StatistiquesFilters = z.infer<typeof statistiquesFiltersSchema>;

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

const eigPeriodStatSchema =
  eigPeriodDeclarationStatSchema.merge(eigCountsStatSchema);

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

const controleQualiteByPeriodStatSchema = controleQualitePeriodBaseSchema.merge(
  z.object({ date: z.coerce.date() })
);

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
    byMonth: z.array(controleQualiteByPeriodStatSchema),
    byTrimester: z.array(controleQualiteByPeriodStatSchema),
    byYear: z.array(controleQualiteByPeriodStatSchema),
  }),
  activite: z.object({
    summary: activiteSummaryStatSchema,
    byMonth: z.array(activiteByMonthStatSchema),
  }),
});

export type TypeStructureStat = z.infer<typeof typeStructureStatSchema>;
export type BatiStat = z.infer<typeof batiStatSchema>;
export type StructuresByYearStat = z.infer<typeof structuresByYearStatSchema>;
export type PlacesByYearStat = z.infer<typeof placesByYearStatSchema>;
export type FinanceByYearScopeStat = z.infer<
  typeof financeByYearScopeStatSchema
>;
export type FinanceByYearStat = z.infer<typeof financeByYearStatSchema>;
export type ActiviteMotifsIndisponibiliteStat = z.infer<
  typeof activiteMotifsIndisponibiliteStatSchema
>;
export type ActiviteSummaryStat = z.infer<typeof activiteSummaryStatSchema>;
export type ActiviteByMonthStat = z.infer<typeof activiteByMonthStatSchema>;
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
export type ControleQualitePeriodStat = z.infer<
  typeof controleQualiteByPeriodStatSchema
>;
export type ControleQualiteByMonthStat = ControleQualitePeriodStat;
export type ControleQualiteByTrimesterStat = ControleQualitePeriodStat;
export type ControleQualiteByYearStat = ControleQualitePeriodStat;

export type StatistiqueApiRead = z.infer<typeof statistiqueApiReadSchema>;
export type StatistiqueApiResponse = StatistiqueApiRead | null;

/** @deprecated Ancien type du mock page `/stats`
 * Benjamin : à remplacer par `StatistiqueApiRead`. */
export type StatistiquesApiType = {
  totalStructures: number;
  totalCpoms: number;
  totalPlaces: number;
  tauxEquipement: number;
  structuresAvecCpom: number;
  placesAutorisees: number;
  dotationAnnuelle: number;
  dotationAutorisees: number;
  dotationSubventionnees: number;
  ETP: number;
  ETPAutorisees: number;
  ETPSubventionnees: number;
  tauxEncadrement: number;
  tauxEncadrementAutorisees: number;
  tauxEncadrementSubventionnees: number;
  coutJournalier: number;
  coutJournalierAutorisees: number;
  coutJournalierSubventionnees: number;
  budgets: (BudgetApiType & {
    excedentCumule: number;
    deficitCumule: number;
    soldeCumule: number;
  })[];
  placesPmr: number;
  placesLgbt: number;
  placesFvvTeh: number;
  placesQPV: number;
  placesLogementsSociaux: number;
  typesPlaces: {
    label: string;
    subLabel?: string;
    byYear: { year: number; nbPlaces: number }[];
  }[];
  structureTypes: {
    label: string;
    byYear: {
      year: number;
      nbStructures: number;
      nbCpoms: number;
      nbPlaces: number;
    }[];
  }[];
  structureBatis: {
    label: string;
    byYear: {
      year: number;
      nbStructures: number;
      nbCpoms: number;
      nbPlaces: number;
    }[];
  }[];
  finance: {
    byYear: {
      year: number;
      total: FinanceByYearScopeStat & { soldeCumule: number };
      autorisees: FinanceByYearScopeStat & { soldeCumule: number };
      subventionnees: FinanceByYearScopeStat & { soldeCumule: number };
    }[];
  };
};
