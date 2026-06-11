import z from "zod";

import { Repartition, StructureType } from "@/generated/prisma/client";

// Filtres passés en query params à GET /api/statistiques
export type StatistiquesFiltersRaw = {
  departements: string | null; // Numéros de départements séparés par virgule
  regions: string | null; // Codes de régions séparés par virgule
  operateurs: string | null; // Codes d'opérateurs séparés par virgule
  types: string | null; // Types de structures séparés par virgule
};

export const structureStatByYearSchema = z.object({
  year: z.number(),
  structures: z.number(),
  cpoms: z.number(),
  places: z.number(),
});

export const structureTypeStatSchema = z.object({
  label: z.string(),
  byYear: z.array(structureStatByYearSchema),
});

export const structureBatiStatSchema = structureTypeStatSchema;

export type StructureStatByYear = z.infer<typeof structureStatByYearSchema>;
export type StructureTypeStat = z.infer<typeof structureTypeStatSchema>;
export type StructureBatiStat = z.infer<typeof structureBatiStatSchema>;

export type TypeStructureStat = {
  type: StructureType | null;
  structures: number;
  places: number;
};

export type BatiStat = {
  bati: Repartition;
  structures: number;
  places: number;
};

export type PlacesSpecialesStat = {
  pmr: number;
  lgbt: number;
  fvvTeh: number;
  logementsSociaux: number;
};

export type YearStat = {
  year: number;
  byType: TypeStructureStat[];
  byBati: BatiStat[];
  placesSpeciales: PlacesSpecialesStat;
};

export type FinanceStatByYear = {
  year: number;
  totalDotationsDemandees: number;
  totalDotationsAccordees: number;
  totalETP: number;
  // TODO: vérifier selon hypothèses cible (REALISE vs PREVISIONNEL, périmètre CPOM)
  tauxEncadrementMedian: number | null;
  coutJournalierMedian: number | null;
  totalProduits: number;
  totalCharges: number;
  excedents: number;
  deficits: number;
  resultatNet: number;
};

export type FinanceStat = Omit<FinanceStatByYear, "year">;

export type EvaluationStat = {
  year?: number;
  nbEvaluations: number;
  moyenneGenerale: number | null;
  moyennePersonne: number | null;
  moyennePro: number | null;
  moyenneStructure: number | null;
};

export type MotifIndisponibilite = {
  desinsectisation: number;
  remiseEnEtat: number;
  sousOccupation: number;
  travaux: number;
};

export type PresencesInduesMois = {
  date: Date;
  presencesInduesBPI: number;
  presencesInduesDeboutees: number;
};

export type ActiviteStat = {
  placesEnregistreesDna: number;
  placesDisponibles: number;
  placesIndisponibles: number;
  motifsIndisponibilite: MotifIndisponibilite;
  presencesInduesTotalBPI: number;
  presencesInduesTotalDeboutees: number;
  suivi: PresencesInduesMois[];
};

export type TauxEquipementDept = {
  departement: string;
  nom: string;
  places: number;
  population: number | null;
  tauxPour1000: number | null;
};

export const statistiquesApiSchema = z.object({
  totalStructures: z.number(),
  totalCpoms: z.number(),
  totalPlaces: z.number(),
  structureTypes: z.array(structureTypeStatSchema),
  structureBatis: z.array(structureBatiStatSchema),
  byType: z.array(
    z.object({
      type: z.nativeEnum(StructureType).nullable(),
      structures: z.number(),
      places: z.number(),
    })
  ),
  byBati: z.array(
    z.object({
      bati: z.nativeEnum(Repartition),
      structures: z.number(),
      places: z.number(),
    })
  ),
  byYear: z.array(
    z.object({
      year: z.number(),
      byType: z.array(
        z.object({
          type: z.nativeEnum(StructureType).nullable(),
          structures: z.number(),
          places: z.number(),
        })
      ),
      byBati: z.array(
        z.object({
          bati: z.nativeEnum(Repartition),
          structures: z.number(),
          places: z.number(),
        })
      ),
      placesSpeciales: z.object({
        pmr: z.number(),
        lgbt: z.number(),
        fvvTeh: z.number(),
        logementsSociaux: z.number(),
      }),
    })
  ),
  tauxEquipement: z.array(
    z.object({
      departement: z.string(),
      nom: z.string(),
      places: z.number(),
      population: z.number().nullable(),
      tauxPour1000: z.number().nullable(),
    })
  ),
  placesSpeciales: z.object({
    pmr: z.number(),
    lgbt: z.number(),
    fvvTeh: z.number(),
    logementsSociaux: z.number(),
  }),
  finance: z.object({
    totalDotationsDemandees: z.number(),
    totalDotationsAccordees: z.number(),
    totalETP: z.number(),
    tauxEncadrementMedian: z.number().nullable(),
    coutJournalierMedian: z.number().nullable(),
    totalProduits: z.number(),
    totalCharges: z.number(),
    excedents: z.number(),
    deficits: z.number(),
    resultatNet: z.number(),
  }),
  financeByYear: z.array(
    z.object({
      year: z.number(),
      totalDotationsDemandees: z.number(),
      totalDotationsAccordees: z.number(),
      totalETP: z.number(),
      tauxEncadrementMedian: z.number().nullable(),
      coutJournalierMedian: z.number().nullable(),
      totalProduits: z.number(),
      totalCharges: z.number(),
      excedents: z.number(),
      deficits: z.number(),
      resultatNet: z.number(),
    })
  ),
  eigPour1000PlacesSur12Mois: z.number().nullable(),
  tauxEigComportementViolent: z.number().nullable(),
  evaluationsByYear: z.array(
    z.object({
      year: z.number().optional(),
      nbEvaluations: z.number(),
      moyenneGenerale: z.number().nullable(),
      moyennePersonne: z.number().nullable(),
      moyennePro: z.number().nullable(),
      moyenneStructure: z.number().nullable(),
    })
  ),
  activites: z.object({
    placesEnregistreesDna: z.number(),
    placesDisponibles: z.number(),
    placesIndisponibles: z.number(),
    motifsIndisponibilite: z.object({
      desinsectisation: z.number(),
      remiseEnEtat: z.number(),
      sousOccupation: z.number(),
      travaux: z.number(),
    }),
    presencesInduesTotalBPI: z.number(),
    presencesInduesTotalDeboutees: z.number(),
    suivi: z.array(
      z.object({
        date: z.coerce.date(),
        presencesInduesBPI: z.number(),
        presencesInduesDeboutees: z.number(),
      })
    ),
  }),
});

export type StatistiquesApiType = z.infer<typeof statistiquesApiSchema>;
