import z from "zod";

import { Repartition, StructureType } from "@/generated/prisma/client";
import type { NumericAggregation } from "@/app/utils/math.util";

export type StatistiquesAggregation = NumericAggregation;

export type StatistiquesFiltersRaw = {
  departements: string | null;
  operateurs: string | null;
  types: string | null;
  /** Agrégation moyenne / médiane (`moyenne` par défaut). */
  aggregation: string | null;
};

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

export type EigStat = {
  /** Ratio EIG / places autorisées sur les 12 derniers mois glissants. */
  tauxEig: number | null;
  nbEig: number;
  nbEigComportementViolent: number;
  tauxEigComportementViolent: number | null;
  moyenneEvaluationsCurrentYear: number | null;
};

export type ControleQualitePeriodStat = {
  nbStructuresSansDeclarationEig: number;
  partStructuresSansDeclarationEig: number | null;
  nbEig: number;
  nbEigComportementViolent: number;
  tauxEigComportementViolent: number | null;
  nbStructuresEvaluees: number;
  noteGenerale: number | null;
  notePersonne: number | null;
  notePro: number | null;
  noteStructure: number | null;
};

export type ControleQualiteByMonthStat = ControleQualitePeriodStat & {
  date: Date;
};

export type ControleQualiteByTrimesterStat = ControleQualitePeriodStat & {
  year: number;
  trimester: number;
};

export type ControleQualiteByYearStat = ControleQualitePeriodStat & {
  year: number;
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

const eigStatSchema = z.object({
  tauxEig: z.number().nullable(),
  nbEig: z.number(),
  nbEigComportementViolent: z.number(),
  tauxEigComportementViolent: z.number().nullable(),
  moyenneEvaluationsCurrentYear: z.number().nullable(),
});

const controleQualitePeriodStatSchema = z.object({
  nbStructuresSansDeclarationEig: z.number(),
  partStructuresSansDeclarationEig: z.number().nullable(),
  nbEig: z.number(),
  nbEigComportementViolent: z.number(),
  tauxEigComportementViolent: z.number().nullable(),
  nbStructuresEvaluees: z.number(),
  noteGenerale: z.number().nullable(),
  notePersonne: z.number().nullable(),
  notePro: z.number().nullable(),
  noteStructure: z.number().nullable(),
});

const controleQualiteByMonthStatSchema = controleQualitePeriodStatSchema.extend({
  date: z.coerce.date(),
});

const controleQualiteByTrimesterStatSchema =
  controleQualitePeriodStatSchema.extend({
    year: z.number(),
    trimester: z.number(),
  });

const controleQualiteByYearStatSchema = controleQualitePeriodStatSchema.extend({
  year: z.number(),
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
    aggregation: z.enum(["moyenne", "mediane"]),
    byYear: z.array(financeByYearStatSchema),
  }),
  controleQualite: z.object({
    aggregation: z.enum(["moyenne", "mediane"]),
    eig: eigStatSchema,
    byMonth: z.array(controleQualiteByMonthStatSchema),
    byTrimester: z.array(controleQualiteByTrimesterStatSchema),
    byYear: z.array(controleQualiteByYearStatSchema),
  }),
  activite: z.object({
    byMonth: z.array(activiteByMonthStatSchema),
  }),
});

export type StatistiqueApiRead = z.infer<typeof statistiqueApiReadSchema>;
