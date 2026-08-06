import type {
  ActeContext,
  BudgetContext,
  IndicateurContext,
  StructureContext,
  TypologieContext,
} from "@/lib/anomalies/anomalie.type";
import { StructureType } from "@/types/structure.type";

export const EPSILON_AMOUNT = 0.01;
export const PLACES_ADRESSES_GAP_THRESHOLD_PCT = 10;

export const isAutorisee = (type: StructureType | null): boolean =>
  type === StructureType.CADA || type === StructureType.CPH;

export const isSubventionnee = (type: StructureType | null): boolean =>
  type === StructureType.HUDA || type === StructureType.CAES;

export type ActeDate = ActeContext & { startDate: Date; endDate: Date };

export const actesWithDates = (
  actes: ActeContext[],
  category: ActeContext["category"]
): ActeDate[] =>
  actes.filter(
    (acte): acte is ActeDate =>
      acte.category === category &&
      acte.isMissing !== true &&
      acte.startDate !== null &&
      acte.endDate !== null
  );

export const durationInYears = ({ startDate, endDate }: ActeDate): number =>
  endDate.getFullYear() - startDate.getFullYear();

export const minDate = (dates: Date[]): Date | null =>
  dates.length === 0
    ? null
    : dates.reduce((plusAncienne, date) =>
        date < plusAncienne ? date : plusAncienne
      );

export const maxDate = (dates: Date[]): Date | null =>
  dates.length === 0
    ? null
    : dates.reduce((plusRecente, date) =>
        date > plusRecente ? date : plusRecente
      );

// Les millésimes futurs sont des projections, pas des anomalies.
export const pastTypologies = (
  typologies: TypologieContext[],
  currentYear: number
): TypologieContext[] =>
  typologies.filter((typologie) => typologie.year <= currentYear);

// Fde l'année d'ouverture (date 303 à défaut création) à l'exercice précédent, l'exercice courant n'étant pas clos.
const isInWindow = (
  year: number,
  structure: StructureContext,
  currentYear: number
): boolean => {
  const openingYear = (
    structure.date303 ?? structure.creationDate
  )?.getFullYear();

  return (
    year < currentYear && (openingYear === undefined || year >= openingYear)
  );
};

export const relevantBudgets = (
  budgets: BudgetContext[],
  structure: StructureContext,
  currentYear: number
): BudgetContext[] =>
  budgets.filter(
    (budget) =>
      budget.isMissing !== true &&
      isInWindow(budget.year, structure, currentYear)
  );

// Un seul indicateur par exercice : le réalisé prime sur le prévisionnel.
export const relevantIndicateurs = (
  indicateurs: IndicateurContext[],
  structure: StructureContext,
  currentYear: number
): IndicateurContext[] => {
  const byYear = new Map<number, IndicateurContext>();

  for (const indicateur of indicateurs) {
    if (
      indicateur.isMissing === true ||
      !isInWindow(indicateur.year, structure, currentYear)
    ) {
      continue;
    }

    const kept = byYear.get(indicateur.year);
    if (kept === undefined || indicateur.type === "REALISE") {
      byYear.set(indicateur.year, indicateur);
    }
  }

  return [...byYear.values()];
};

export const getResultatNet = (budget: BudgetContext): number | null =>
  budget.totalProduits === null && budget.totalCharges === null
    ? null
    : (budget.totalProduits ?? 0) - (budget.totalCharges ?? 0);

// Null si aucune ligne du détail n'est renseignée
export const sumAffectationsDetail = (budget: BudgetContext): number | null => {
  const sum =
    (budget.reserveInvestissement ?? 0) +
    (budget.chargesNonReconductibles ?? 0) +
    (budget.reserveCompensationDeficits ?? 0) +
    (budget.reserveCompensationBFR ?? 0) +
    (budget.reserveCompensationAmortissements ?? 0) +
    (budget.reportANouveau ?? 0) +
    (budget.autre ?? 0);

  return sum === 0 ? null : sum;
};

export const sumExcedents = (budget: BudgetContext): number =>
  (budget.excedentRecupere ?? 0) +
  (budget.excedentDeduit ?? 0) +
  (budget.fondsDedies ?? 0);

export const differsFrom = (value: number, reference: number): boolean =>
  Math.abs(value - reference) > EPSILON_AMOUNT;
