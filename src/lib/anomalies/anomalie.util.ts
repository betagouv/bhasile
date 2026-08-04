import type {
  BudgetContexte,
  StructureContexte,
} from "@/lib/anomalies/anomalie.contexte";
import { StructureType } from "@/types/structure.type";

export const estAutorisee = (type: StructureType | null): boolean =>
  type === StructureType.CADA || type === StructureType.CPH;

export const estSubventionnee = (type: StructureType | null): boolean =>
  type === StructureType.HUDA || type === StructureType.CAES;

export const resultatNet = (budget: BudgetContexte): number | null =>
  budget.totalProduits === null && budget.totalCharges === null
    ? null
    : (budget.totalProduits ?? 0) - (budget.totalCharges ?? 0);

// Reprise de la fenêtre des vues 004c : de l'année d'ouverture (date 303 à défaut création)
// à l'exercice précédent, l'exercice courant n'étant pas clos.
export const budgetsPertinents = (
  budgets: BudgetContexte[],
  structure: StructureContexte,
  anneeCourante: number
): BudgetContexte[] => {
  const anneeOuverture = (
    structure.date303 ?? structure.creationDate
  )?.getFullYear();

  return budgets.filter(
    (budget) =>
      budget.isMissing !== true &&
      budget.year < anneeCourante &&
      (anneeOuverture === undefined || budget.year >= anneeOuverture)
  );
};
