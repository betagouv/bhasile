import { parseDate } from "@/app/utils/date.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { StructureType } from "@/types/structure.type";

import type { AnomalieContext } from "./anomalie.type";

export const buildFormAnomalieContext = (
  structure: StructureApiRead,
  overrides: Partial<AnomalieContext> = {}
): AnomalieContext => ({
  structure: {
    type: (structure.type as StructureType | null) ?? null,
    departementAdministratif: structure.departementAdministratif ?? null,
    // Seul COUT_JOURNALIER_GT_TARIF_CIBLE l'utilise, et il n'est pas affiché.
    tarifJournalierCible: null,
    creationDate: parseDate(structure.creationDate),
    date303: parseDate(structure.date303),
    placesAutorisees: structure.placesAutorisees ?? null,
    lgbt: structure.lgbt ?? null,
    fvvTeh: structure.fvvTeh ?? null,
    debutConvention: parseDate(structure.debutConvention),
    finConvention: parseDate(structure.finConvention),
    debutPeriodeAutorisation: parseDate(structure.debutPeriodeAutorisation),
    finPeriodeAutorisation: parseDate(structure.finPeriodeAutorisation),
  },
  typologies: (structure.structureTypologies ?? []).map((typologie) => ({
    year: typologie.year,
    placesAutorisees: typologie.placesAutorisees ?? null,
    pmr: typologie.pmr ?? null,
    lgbt: typologie.lgbt ?? null,
    fvvTeh: typologie.fvvTeh ?? null,
  })),
  actes: (structure.actesAdministratifs ?? []).flatMap((acte) =>
    acte.id === undefined
      ? []
      : [
          {
            id: acte.id,
            category: acte.category as ActeAdministratifCategory,
            startDate: parseDate(acte.startDate),
            endDate: parseDate(acte.endDate),
            parentId: acte.parentId ?? null,
            cpomId: acte.cpomId ?? null,
            hasFile: (acte.fileUploads?.length ?? 0) > 0,
          },
        ]
  ),
  adresses: (structure.adresses ?? []).flatMap((adresse) =>
    adresse.id === undefined
      ? []
      : [{ id: adresse.id, placesAutorisees: adresse.placesAutorisees ?? null }]
  ),
  budgets: (structure.budgets ?? []).map((budget) => ({
    year: budget.year,
    totalProduits: budget.totalProduits ?? null,
    totalCharges: budget.totalCharges ?? null,
    repriseEtat: budget.repriseEtat ?? null,
    excedentRecupere: budget.excedentRecupere ?? null,
    excedentDeduit: budget.excedentDeduit ?? null,
    fondsDedies: budget.fondsDedies ?? null,
    affectationReservesFondsDedies:
      budget.affectationReservesFondsDedies ?? null,
    reserveInvestissement: budget.reserveInvestissement ?? null,
    chargesNonReconductibles: budget.chargesNonReconductibles ?? null,
    reserveCompensationDeficits: budget.reserveCompensationDeficits ?? null,
    reserveCompensationBFR: budget.reserveCompensationBFR ?? null,
    reserveCompensationAmortissements:
      budget.reserveCompensationAmortissements ?? null,
    reportANouveau: budget.reportANouveau ?? null,
    autre: budget.autre ?? null,
  })),
  indicateurs: (structure.indicateursFinanciers ?? []).map((indicateur) => ({
    year: indicateur.year,
    type: indicateur.type,
    tauxEncadrement: indicateur.tauxEncadrement ?? null,
    coutJournalier: indicateur.coutJournalier ?? null,
  })),
  ...overrides,
});
