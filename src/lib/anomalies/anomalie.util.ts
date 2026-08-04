import type {
  ActeContexte,
  BudgetContexte,
  IndicateurContexte,
  StructureContexte,
  TypologieContexte,
} from "@/lib/anomalies/anomalie.contexte";
import { StructureType } from "@/types/structure.type";

export const EPSILON_MONTANT = 0.01;
export const SEUIL_ECART_PLACES_ADRESSES_PCT = 10;

export const estAutorisee = (type: StructureType | null): boolean =>
  type === StructureType.CADA || type === StructureType.CPH;

export const estSubventionnee = (type: StructureType | null): boolean =>
  type === StructureType.HUDA || type === StructureType.CAES;

export type ActeDate = ActeContexte & { startDate: Date; endDate: Date };

export const actesDatesConnues = (
  actes: ActeContexte[],
  category: ActeContexte["category"]
): ActeDate[] =>
  actes.filter(
    (acte): acte is ActeDate =>
      acte.category === category &&
      acte.isMissing !== true &&
      acte.startDate !== null &&
      acte.endDate !== null
  );

export const dureeEnAnnees = ({ startDate, endDate }: ActeDate): number =>
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
export const typologiesEchues = (
  typologies: TypologieContexte[],
  anneeCourante: number
): TypologieContexte[] =>
  typologies.filter((typologie) => typologie.year <= anneeCourante);

// Reprise de la fenêtre des vues 004c : de l'année d'ouverture (date 303 à défaut création)
// à l'exercice précédent, l'exercice courant n'étant pas clos.
const dansLaFenetre = (
  year: number,
  structure: StructureContexte,
  anneeCourante: number
): boolean => {
  const anneeOuverture = (
    structure.date303 ?? structure.creationDate
  )?.getFullYear();

  return (
    year < anneeCourante &&
    (anneeOuverture === undefined || year >= anneeOuverture)
  );
};

export const budgetsPertinents = (
  budgets: BudgetContexte[],
  structure: StructureContexte,
  anneeCourante: number
): BudgetContexte[] =>
  budgets.filter(
    (budget) =>
      budget.isMissing !== true &&
      dansLaFenetre(budget.year, structure, anneeCourante)
  );

// Un seul indicateur par exercice : le réalisé prime sur le prévisionnel.
export const indicateursPertinents = (
  indicateurs: IndicateurContexte[],
  structure: StructureContexte,
  anneeCourante: number
): IndicateurContexte[] => {
  const parAnnee = new Map<number, IndicateurContexte>();

  for (const indicateur of indicateurs) {
    if (
      indicateur.isMissing === true ||
      !dansLaFenetre(indicateur.year, structure, anneeCourante)
    ) {
      continue;
    }

    const retenu = parAnnee.get(indicateur.year);
    if (retenu === undefined || indicateur.type === "REALISE") {
      parAnnee.set(indicateur.year, indicateur);
    }
  }

  return [...parAnnee.values()];
};

export const resultatNet = (budget: BudgetContexte): number | null =>
  budget.totalProduits === null && budget.totalCharges === null
    ? null
    : (budget.totalProduits ?? 0) - (budget.totalCharges ?? 0);

// NULL si aucune ligne du détail n'est renseignée, à l'image du NULLIF de la vue 004c.
export const sommeDetailAffectations = (
  budget: BudgetContexte
): number | null => {
  const somme =
    (budget.reserveInvestissement ?? 0) +
    (budget.chargesNonReconductibles ?? 0) +
    (budget.reserveCompensationDeficits ?? 0) +
    (budget.reserveCompensationBFR ?? 0) +
    (budget.reserveCompensationAmortissements ?? 0) +
    (budget.reportANouveau ?? 0) +
    (budget.autre ?? 0);

  return somme === 0 ? null : somme;
};

export const sommeExcedents = (budget: BudgetContexte): number =>
  (budget.excedentRecupere ?? 0) +
  (budget.excedentDeduit ?? 0) +
  (budget.fondsDedies ?? 0);

export const ecarteDe = (valeur: number, reference: number): boolean =>
  Math.abs(valeur - reference) > EPSILON_MONTANT;
