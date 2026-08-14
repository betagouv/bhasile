import { parseDate } from "@/app/utils/date.util";
import { parseFrenchNumber } from "@/app/utils/number.util";
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
    placesAutorisees: parseFrenchNumber(structure.placesAutorisees),
    lgbt: structure.lgbt ?? null,
    fvvTeh: structure.fvvTeh ?? null,
    debutConvention: parseDate(structure.debutConvention),
    finConvention: parseDate(structure.finConvention),
    debutPeriodeAutorisation: parseDate(structure.debutPeriodeAutorisation),
    finPeriodeAutorisation: parseDate(structure.finPeriodeAutorisation),
  },
  typologies: structure.structureTypologies?.map((typologie) => ({
    year: typologie.year,
    placesAutorisees: parseFrenchNumber(typologie.placesAutorisees),
    pmr: parseFrenchNumber(typologie.pmr),
    lgbt: parseFrenchNumber(typologie.lgbt),
    fvvTeh: parseFrenchNumber(typologie.fvvTeh),
  })),
  actes: structure.actesAdministratifs?.flatMap((acte) =>
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
  adresses: structure.adresses?.flatMap((adresse) =>
    adresse.id === undefined
      ? []
      : [
          {
            id: adresse.id,
            placesAutorisees: parseFrenchNumber(adresse.placesAutorisees),
          },
        ]
  ),
  budgets: structure.budgets?.map((budget) => ({
    year: budget.year,
    totalProduits: parseFrenchNumber(budget.totalProduits),
    totalCharges: parseFrenchNumber(budget.totalCharges),
    repriseEtat: parseFrenchNumber(budget.repriseEtat),
    excedentRecupere: parseFrenchNumber(budget.excedentRecupere),
    excedentDeduit: parseFrenchNumber(budget.excedentDeduit),
    fondsDedies: parseFrenchNumber(budget.fondsDedies),
    affectationReservesFondsDedies: parseFrenchNumber(
      budget.affectationReservesFondsDedies
    ),
    reserveInvestissement: parseFrenchNumber(budget.reserveInvestissement),
    chargesNonReconductibles: parseFrenchNumber(
      budget.chargesNonReconductibles
    ),
    reserveCompensationDeficits: parseFrenchNumber(
      budget.reserveCompensationDeficits
    ),
    reserveCompensationBFR: parseFrenchNumber(budget.reserveCompensationBFR),
    reserveCompensationAmortissements: parseFrenchNumber(
      budget.reserveCompensationAmortissements
    ),
    reportANouveau: parseFrenchNumber(budget.reportANouveau),
    autre: parseFrenchNumber(budget.autre),
  })),
  indicateurs: structure.indicateursFinanciers?.map((indicateur) => ({
    year: indicateur.year,
    type: indicateur.type,
    tauxEncadrement: parseFrenchNumber(indicateur.tauxEncadrement),
    coutJournalier: parseFrenchNumber(indicateur.coutJournalier),
  })),
  ...overrides,
});
