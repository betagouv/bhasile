import { startOfNextUtcDay } from "@/app/utils/date.util";
import { getNow } from "@/app/utils/now.util";
import { CODE_REGION_IDF } from "@/constants";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

import {
  ACTUALISATION_FORM_SLUG_PREFIX,
  FINALISATION_FORM_SLUG,
} from "../forms/form.constants";
import { finalizedVersionWhere } from "../structure-versions/structure-version.db.type";
import type {
  StatistiqueDbActivite,
  StatistiqueDbAdresse,
  StatistiqueDbBudget,
  StatistiqueDbCpomStructure,
  StatistiqueDbDepartement,
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
  StatistiqueDbFormDefinition,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbRmu,
  StatistiqueDbStructure,
  StatistiqueDbStructureActivity,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTarifJournalierCible,
  StatistiqueDbTauxEncadrementCible,
  StatistiqueDbTypologie,
  StatistiqueDbValidatedActualisation,
} from "./statistiques.db.type";
import type { StatistiquesResolvedPerimeterFilters } from "./statistiques.util";

/** Année plancher des EIG remontés dans les stats (borne haute = année courante). */
const EIG_STATS_MIN_YEAR = 2015;

/** Filiales directes des opérateurs donnés (résolution du filtre `operateurs`, cf. statistique.service). */
export const findOperateurFiliales = async (
  parentIds: number[]
): Promise<{ id: number }[]> => {
  if (parentIds.length === 0) {
    return [];
  }
  return prisma.operateur.findMany({
    where: { parentId: { in: parentIds } },
    select: { id: true },
  });
};

export const findPerimeterStructures = async (
  resolved: StatistiquesResolvedPerimeterFilters,
  reference: Date = getNow()
): Promise<StatistiqueDbStructure[]> =>
  prisma.structure.findMany({
    where: {
      type: { in: [...resolved.types] },
      ...(resolved.departements
        ? { departementAdministratif: { in: [...resolved.departements] } }
        : {}),
      ...(resolved.operateurIds
        ? { operateurId: { in: [...resolved.operateurIds] } }
        : {}),
      structureVersions: {
        some: {
          AND: [
            finalizedVersionWhere,
            {
              OR: [
                { effectiveDate: null },
                { effectiveDate: { lt: startOfNextUtcDay(reference) } },
              ],
            },
          ],
        },
      },
      // Structures initialisées uniquement (même règle que `isStructureFinalised`).
      OR: [
        {
          forms: {
            some: {
              status: true,
              formDefinition: { slug: FINALISATION_FORM_SLUG },
            },
          },
        },
        {
          structureVersions: {
            some: {
              effectiveDate: { lt: startOfNextUtcDay(reference) },
              structureVersionTransformation: {
                type: StructureVersionTransformationType.CREATION,
                transformation: { form: { status: true } },
              },
            },
          },
        },
      ],
    },
    select: { id: true, type: true, departementAdministratif: true },
  });

export const findStructureActivityDates = async (
  structureIds: number[]
): Promise<StatistiqueDbStructureActivity[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  return prisma.structure.findMany({
    where: { id: { in: structureIds } },
    select: {
      id: true,
      creationDate: true,
      fermetureDate: true,
    },
  });
};

export const findValidatedActualisationForms = async (
  structureIds: number[]
): Promise<StatistiqueDbValidatedActualisation[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  return prisma.form.findMany({
    where: {
      structureId: { in: structureIds },
      status: true,
      formDefinition: { slug: { startsWith: ACTUALISATION_FORM_SLUG_PREFIX } },
    },
    select: {
      structureId: true,
      formDefinition: { select: { slug: true, deadline: true } },
    },
  });
};

export const findActualisationFormDefinitions = async (): Promise<
  StatistiqueDbFormDefinition[]
> =>
  prisma.formDefinition.findMany({
    where: { slug: { startsWith: ACTUALISATION_FORM_SLUG_PREFIX } },
    select: { slug: true, deadline: true },
  });

export const findIdfDepartementNumeros = async (): Promise<string[]> => {
  const departements = await prisma.departement.findMany({
    where: { regionAdministrative: { code: CODE_REGION_IDF } },
    select: { numero: true },
  });

  return departements.map((departement) => departement.numero);
};

/** CADA créés par une transformation HUDA vers CADA finalisée. */
export const findCadaFromHudaStructureIds = async (
  structureIds: number[]
): Promise<number[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  const versions = await prisma.structureVersion.findMany({
    where: {
      structureId: { in: structureIds },
      structureVersionTransformation: {
        type: StructureVersionTransformationType.CREATION,
        transformation: {
          type: {
            in: [
              TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU,
              TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU,
            ],
          },
          form: { status: true },
        },
      },
    },
    select: { structureId: true },
  });

  return versions
    .map((version) => version.structureId)
    .filter((structureId): structureId is number => structureId !== null);
};

export const findTarifsJournaliersCibles = async (): Promise<
  StatistiqueDbTarifJournalierCible[]
> => {
  const cibles = await prisma.tarifJournalierCible.findMany();

  return cibles.map((cible) => ({
    structureType: cible.structure_type,
    year: cible.year,
    isIdf: cible.belongs_to_idf,
    tarifCible: cible.tarif_cible.toNumber(),
  }));
};

export const findTauxEncadrementCibles = async (): Promise<
  StatistiqueDbTauxEncadrementCible[]
> => {
  const cibles = await prisma.tauxEncadrementCible.findMany();

  return cibles.map((cible) => ({
    structureType: cible.structure_type,
    year: cible.year,
    isIdf: cible.belongs_to_idf,
    isFromHuda: cible.comes_from_huda,
    tauxCible: cible.taux_cible.toNumber(),
  }));
};

const structureVersionScope = (structureIds: number[]) => ({
  structureVersion: { structureId: { in: structureIds } },
});

const structureIdFromVersion = (row: {
  structureVersion: { structureId: number | null } | null;
}): number => row.structureVersion!.structureId!;

export const findStructureTypologies = async (
  structureIds: number[]
): Promise<StatistiqueDbTypologie[]> => {
  const rows = await prisma.structureTypologie.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      id: true,
      structureId: true,
      year: true,
      placesAutorisees: true,
      pmr: true,
      lgbt: true,
      fvvTeh: true,
    },
    orderBy: { year: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    structureId: row.structureId!,
    year: row.year,
    placesAutorisees: row.placesAutorisees,
    pmr: row.pmr,
    lgbt: row.lgbt,
    fvvTeh: row.fvvTeh,
  }));
};

/** Historique complet (toutes versions) - la résolution "à quelle date" se fait en aval. */
export const findStructureAdresses = async (
  structureIds: number[]
): Promise<StatistiqueDbAdresse[]> => {
  const rows = await prisma.adresse.findMany({
    where: structureVersionScope(structureIds),
    select: {
      id: true,
      structureVersionId: true,
      structureVersion: { select: { structureId: true } },
      repartition: true,
      placesAutorisees: true,
      isQpv: true,
      isLogementSocial: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    structureId: structureIdFromVersion(row),
    structureVersionId: row.structureVersionId!,
    repartition: row.repartition,
    placesAutorisees: row.placesAutorisees,
    isQpv: row.isQpv,
    isLogementSocial: row.isLogementSocial,
  }));
};

export const findDnaLinks = async (
  structureIds: number[]
): Promise<StatistiqueDbDnaLink[]> => {
  const rows = await prisma.dnaStructure.findMany({
    where: structureVersionScope(structureIds),
    select: {
      id: true,
      structureVersionId: true,
      structureVersion: { select: { structureId: true } },
      dna: { select: { code: true } },
    },
  });

  return rows
    .filter((row) => row.structureVersionId != null)
    .map((row) => ({
      id: row.id,
      structureId: structureIdFromVersion(row),
      structureVersionId: row.structureVersionId!,
      dna: row.dna,
    }));
};

export const findStructureVersionTimeline = async (
  structureIds: number[]
): Promise<StatistiqueDbStructureVersionTimeline[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  return prisma.structureVersion.findMany({
    where: {
      structureId: { in: structureIds },
      ...finalizedVersionWhere,
    },
    select: {
      id: true,
      structureId: true,
      effectiveDate: true,
      placesAutorisees: true,
    },
    orderBy: [
      { structureId: "asc" },
      { effectiveDate: "desc" },
      { id: "desc" },
    ],
  });
};

export const findDepartementsWithPopulation = async (
  departementNumeros: string[]
): Promise<StatistiqueDbDepartement[]> => {
  return prisma.departement.findMany({
    where:
      departementNumeros.length > 0
        ? { numero: { in: departementNumeros } }
        : undefined,
    select: { numero: true, name: true, population: true },
  });
};

export const findCpomStructures = async (
  structureIds: number[]
): Promise<StatistiqueDbCpomStructure[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.cpomStructure.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      id: true,
      cpomId: true,
      structureId: true,
      dateStart: true,
      dateEnd: true,
      cpom: {
        select: {
          actesAdministratifs: {
            select: {
              id: true,
              category: true,
              startDate: true,
              endDate: true,
              parentId: true,
            },
          },
        },
      },
    },
  });
};

export const findEigs = async (
  dnaCodes: string[]
): Promise<StatistiqueDbEig[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  const currentYear = getNow().getUTCFullYear();
  return prisma.evenementIndesirableGrave.findMany({
    where: {
      dnaCode: { in: dnaCodes },
      evenementDate: {
        gte: new Date(Date.UTC(EIG_STATS_MIN_YEAR, 0, 1)),
        lt: new Date(Date.UTC(currentYear + 1, 0, 1)),
      },
    },
    select: { id: true, dnaCode: true, type: true, evenementDate: true },
    orderBy: { evenementDate: "asc" },
  });
};

export const findEvaluations = async (
  structureIds: number[]
): Promise<StatistiqueDbEvaluation[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.evaluation.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      id: true,
      structureId: true,
      date: true,
      note: true,
      notePersonne: true,
      notePro: true,
      noteStructure: true,
    },
    orderBy: { date: "asc" },
  });
};

export const findBudgets = async (
  structureIds: number[]
): Promise<StatistiqueDbBudget[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  const budgets = await prisma.budget.findMany({
    where: {
      structureId: { in: structureIds },
    },
    select: {
      id: true,
      structureId: true,
      year: true,
      dotationDemandee: true,
      dotationAccordee: true,
      totalProduits: true,
      totalCharges: true,
    },
    orderBy: [{ year: "asc" }, { structureId: "asc" }],
  });

  return budgets.flatMap((budget) => {
    if (budget.structureId === null) {
      return [];
    }

    return [
      {
        id: budget.id,
        structureId: budget.structureId,
        year: budget.year,
        dotationDemandee: budget.dotationDemandee ?? 0,
        dotationAccordee: budget.dotationAccordee ?? 0,
        totalProduits: budget.totalProduits ?? 0,
        totalCharges: budget.totalCharges ?? 0,
      },
    ];
  });
};

export const findIndicateursFinanciers = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurFinancier[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.indicateurFinancier.findMany({
    where: {
      structureId: { in: structureIds },
    },
    select: {
      id: true,
      structureId: true,
      year: true,
      type: true,
      ETP: true,
      tauxEncadrement: true,
      coutJournalier: true,
    },
  });
};

export const findRmus = async (
  departementNumeros: Set<string> | null
): Promise<StatistiqueDbRmu[]> => {
  return prisma.rmu.findMany({
    where: departementNumeros
      ? { departementNumero: { in: [...departementNumeros] } }
      : undefined,
    select: {
      id: true,
      departementNumero: true,
      date: true,
      referesEngages: true,
      referesExecutes: true,
    },
    orderBy: { date: "asc" },
  });
};

export const findActivites = async (
  dnaCodes: string[]
): Promise<StatistiqueDbActivite[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.activite.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: {
      id: true,
      dnaCode: true,
      date: true,
      placesAutorisees: true,
      desinsectisation: true,
      remiseEnEtat: true,
      sousOccupation: true,
      travaux: true,
      placesIndisponibles: true,
      placesOccupees: true,
      presencesInduesBPI: true,
      presencesInduesDeboutees: true,
    },
    orderBy: { date: "desc" },
  });
};
