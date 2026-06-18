import z from "zod";

import { Repartition, StructureType } from "@/generated/prisma/client";

export type StatistiquesFiltersRaw = {
  departements: string | null;
  operateurs: string | null;
  types: string | null;
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

export type PlacesSpecialesStat = {
  pmr: number;
  lgbt: number;
  fvvTeh: number;
  qpv: number;
  logementsSociaux: number;
};

export type PlacesYearStat = {
  year: number;
  totalPlaces: number;
  placesSpeciales: PlacesSpecialesStat;
};

export type FinanceMedianByType = {
  type: StructureType;
  tauxEncadrementMedian: number | null;
  coutJournalierMedian: number | null;
};

export type FinanceStatByYear = {
  year: number;
  totalDotationsDemandees: number;
  totalDotationsAccordees: number;
  totalETP: number;
  tauxEncadrementMedian: number | null;
  coutJournalierMedian: number | null;
  byType: FinanceMedianByType[];
  totalProduits: number;
  totalCharges: number;
  excedents: number;
  deficits: number;
  resultatNet: number;
};

export type FinanceStat = Omit<FinanceStatByYear, "year">;

export type FinanceScopeStat = {
  total: FinanceStat;
  autorisees: FinanceStat;
  subventionnees: FinanceStat;
};

export type FinanceScopeStatByYear = {
  year: number;
  total: FinanceStatByYear;
  autorisees: FinanceStatByYear;
  subventionnees: FinanceStatByYear;
};

export type EigStat = {
  pour1000PlacesSur12Mois: number | null;
  tauxComportementViolent: number | null;
  nbComportementViolent: number;
  nbAutres: number;
  nbStructuresSansDeclaration: number;
};

export type EigMonthStat = {
  date: Date;
  nbComportementViolent: number;
  nbAutres: number;
  nbTotal: number;
};

export type EvaluationStat = {
  nbEvaluations: number;
  nbStructuresEvaluees: number;
  moyenneGenerale: number | null;
  moyennePersonne: number | null;
  moyennePro: number | null;
  moyenneStructure: number | null;
};

export type EvaluationMonthStat = EvaluationStat & {
  date: Date;
};

export type MotifIndisponibilite = {
  desinsectisation: number;
  remiseEnEtat: number;
  sousOccupation: number;
  travaux: number;
};

export type PresencesInduesMonthStat = {
  date: Date;
  presencesInduesBPI: number;
  presencesInduesDeboutees: number;
  placesAutorisees: number;
};

export type TauxEquipementDept = {
  departement: string;
  nom: string;
  places: number;
  population: number | null;
  tauxPour1000: number | null;
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

const placesSpecialesSchema = z.object({
  pmr: z.number(),
  lgbt: z.number(),
  fvvTeh: z.number(),
  qpv: z.number(),
  logementsSociaux: z.number(),
});

const financeMedianByTypeSchema = z.object({
  type: z.nativeEnum(StructureType),
  tauxEncadrementMedian: z.number().nullable(),
  coutJournalierMedian: z.number().nullable(),
});

const financeStatSchema = z.object({
  totalDotationsDemandees: z.number(),
  totalDotationsAccordees: z.number(),
  totalETP: z.number(),
  tauxEncadrementMedian: z.number().nullable(),
  coutJournalierMedian: z.number().nullable(),
  byType: z.array(financeMedianByTypeSchema),
  totalProduits: z.number(),
  totalCharges: z.number(),
  excedents: z.number(),
  deficits: z.number(),
  resultatNet: z.number(),
});

const financeStatByYearSchema = financeStatSchema.extend({
  year: z.number(),
});

const financeScopeStatSchema = z.object({
  total: financeStatSchema,
  autorisees: financeStatSchema,
  subventionnees: financeStatSchema,
});

const financeScopeStatByYearSchema = z.object({
  year: z.number(),
  total: financeStatByYearSchema,
  autorisees: financeStatByYearSchema,
  subventionnees: financeStatByYearSchema,
});

const eigStatSchema = z.object({
  pour1000PlacesSur12Mois: z.number().nullable(),
  tauxComportementViolent: z.number().nullable(),
  nbComportementViolent: z.number(),
  nbAutres: z.number(),
  nbStructuresSansDeclaration: z.number(),
});

const evaluationStatSchema = z.object({
  nbEvaluations: z.number(),
  nbStructuresEvaluees: z.number(),
  moyenneGenerale: z.number().nullable(),
  moyennePersonne: z.number().nullable(),
  moyennePro: z.number().nullable(),
  moyenneStructure: z.number().nullable(),
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
  places: z.object({
    totalPlaces: z.number(),
    tauxEquipement: z.array(
      z.object({
        departement: z.string(),
        nom: z.string(),
        places: z.number(),
        population: z.number().nullable(),
        tauxPour1000: z.number().nullable(),
      })
    ),
    placesSpeciales: placesSpecialesSchema,
    byYear: z.array(
      z.object({
        year: z.number(),
        totalPlaces: z.number(),
        placesSpeciales: placesSpecialesSchema,
      })
    ),
  }),
  finance: z.object({
    summary: financeScopeStatSchema,
    byYear: z.array(financeScopeStatByYearSchema),
  }),
  controleQualite: z.object({
    eig: eigStatSchema,
    eigByMonth: z.array(
      z.object({
        date: z.coerce.date(),
        nbComportementViolent: z.number(),
        nbAutres: z.number(),
        nbTotal: z.number(),
      })
    ),
    evaluations: z.object({
      summary: evaluationStatSchema,
      byMonth: z.array(
        evaluationStatSchema.extend({
          date: z.coerce.date(),
        })
      ),
    }),
  }),
  activite: z.object({
    placesEnregistreesDna: z.number(),
    placesDisponibles: z.number(),
    placesIndisponibles: z.number(),
    motifsIndisponibilite: z.object({
      desinsectisation: z.number(),
      remiseEnEtat: z.number(),
      sousOccupation: z.number(),
      travaux: z.number(),
    }),
    presencesInduesByMonth: z.array(
      z.object({
        date: z.coerce.date(),
        presencesInduesBPI: z.number(),
        presencesInduesDeboutees: z.number(),
        placesAutorisees: z.number(),
      })
    ),
  }),
});

export type StatistiqueApiRead = z.infer<typeof statistiqueApiReadSchema>;
