import { defineRule } from "@/lib/anomalies/anomalie.rule";
import {
  differsFrom,
  getResultatNet,
  isAutorisee,
  isSubventionnee,
  relevantBudgets,
  relevantIndicateurs,
  sumAffectationsDetail,
  sumExcedents,
} from "@/lib/anomalies/anomalie.util";
import { ANOMALIE_TARGET_STRUCTURE } from "@/types/anomalie.type";

const TAUX_ENCADREMENT_THRESHOLD_AUTORISEE = 20;
const TAUX_ENCADREMENT_THRESHOLD_SUBVENTIONNEE = 25;
const TAUX_ENCADREMENT_LOW_THRESHOLD = 2;
const COUT_JOURNALIER_LOW_THRESHOLD = 15;

const onYear = (year: number) => ({
  year,
  targetId: ANOMALIE_TARGET_STRUCTURE,
});

export const FINANCE_RULES = [
  defineRule({
    code: "TAUX_ENCADREMENT_GT_SEUIL",
    requires: ["structure", "indicateurs"],
    evaluates: ({ structure, indicateurs }, { currentYear }) => {
      const threshold = isAutorisee(structure.type)
        ? TAUX_ENCADREMENT_THRESHOLD_AUTORISEE
        : isSubventionnee(structure.type)
          ? TAUX_ENCADREMENT_THRESHOLD_SUBVENTIONNEE
          : null;
      if (threshold === null) {
        return [];
      }

      return relevantIndicateurs(indicateurs, structure, currentYear)
        .filter(
          (indicateur) =>
            indicateur.tauxEncadrement !== null &&
            indicateur.tauxEncadrement > threshold
        )
        .map((indicateur) => onYear(indicateur.year));
    },
  }),

  defineRule({
    code: "TAUX_ENCADREMENT_LT_2",
    requires: ["structure", "indicateurs"],
    evaluates: ({ structure, indicateurs }, { currentYear }) =>
      relevantIndicateurs(indicateurs, structure, currentYear)
        .filter(
          (indicateur) =>
            indicateur.tauxEncadrement !== null &&
            indicateur.tauxEncadrement < TAUX_ENCADREMENT_LOW_THRESHOLD
        )
        .map((indicateur) => onYear(indicateur.year)),
  }),

  defineRule({
    code: "COUT_JOURNALIER_GT_TARIF_CIBLE",
    requires: ["structure", "indicateurs"],
    evaluates: ({ structure, indicateurs }, { currentYear }) => {
      const tarifCible = structure.tarifJournalierCible;
      if (tarifCible === null) {
        return [];
      }

      return relevantIndicateurs(indicateurs, structure, currentYear)
        .filter(
          (indicateur) =>
            indicateur.coutJournalier !== null &&
            indicateur.coutJournalier > tarifCible
        )
        .map((indicateur) => onYear(indicateur.year));
    },
  }),

  defineRule({
    code: "COUT_JOURNALIER_LT_15",
    requires: ["structure", "indicateurs"],
    evaluates: ({ structure, indicateurs }, { currentYear }) =>
      relevantIndicateurs(indicateurs, structure, currentYear)
        .filter(
          (indicateur) =>
            indicateur.coutJournalier !== null &&
            indicateur.coutJournalier < COUT_JOURNALIER_LOW_THRESHOLD
        )
        .map((indicateur) => onYear(indicateur.year)),
  }),

  defineRule({
    code: "RESULTAT_NET_EQ_0",
    requires: ["structure", "budgets"],
    evaluates: ({ structure, budgets }, { currentYear }) =>
      relevantBudgets(budgets, structure, currentYear)
        .filter((budget) => getResultatNet(budget) === 0)
        .map((budget) => onYear(budget.year)),
  }),

  defineRule({
    code: "AFFECTATION_DETAIL_MANQUANT",
    requires: ["structure", "budgets"],
    evaluates: ({ structure, budgets }, { currentYear }) => {
      if (!isAutorisee(structure.type)) {
        return [];
      }

      return relevantBudgets(budgets, structure, currentYear)
        .filter(
          (budget) =>
            (budget.affectationReservesFondsDedies ?? 0) !== 0 &&
            sumAffectationsDetail(budget) === null
        )
        .map((budget) => onYear(budget.year));
    },
  }),

  defineRule({
    code: "AFFECTATION_DETAIL_ECART",
    requires: ["structure", "budgets"],
    evaluates: ({ structure, budgets }, { currentYear }) => {
      if (!isAutorisee(structure.type)) {
        return [];
      }

      return relevantBudgets(budgets, structure, currentYear)
        .filter((budget) => {
          const affectation = budget.affectationReservesFondsDedies ?? 0;
          const detail = sumAffectationsDetail(budget);

          return (
            affectation !== 0 &&
            detail !== null &&
            differsFrom(detail, affectation)
          );
        })
        .map((budget) => onYear(budget.year));
    },
  }),

  defineRule({
    code: "REPRISE_PLUS_AFFECTATION_ECART",
    requires: ["structure", "budgets"],
    evaluates: ({ structure, budgets }, { currentYear }) => {
      if (!isAutorisee(structure.type)) {
        return [];
      }

      return relevantBudgets(budgets, structure, currentYear)
        .filter((budget) => {
          const resultatNet = getResultatNet(budget);

          return (
            resultatNet !== null &&
            budget.affectationReservesFondsDedies !== null &&
            differsFrom(
              (budget.repriseEtat ?? 0) + budget.affectationReservesFondsDedies,
              resultatNet
            )
          );
        })
        .map((budget) => onYear(budget.year));
    },
  }),

  defineRule({
    code: "REPRISE_ETAT_SIGNE_INVERSE",
    requires: ["structure", "budgets"],
    evaluates: ({ structure, budgets }, { currentYear }) => {
      if (!isAutorisee(structure.type)) {
        return [];
      }

      return relevantBudgets(budgets, structure, currentYear)
        .filter((budget) => {
          const resultatNet = getResultatNet(budget);
          const affectation = budget.affectationReservesFondsDedies;

          return (
            resultatNet !== null &&
            budget.repriseEtat !== null &&
            affectation !== null &&
            differsFrom(budget.repriseEtat + affectation, resultatNet) &&
            !differsFrom(-budget.repriseEtat + affectation, resultatNet)
          );
        })
        .map((budget) => onYear(budget.year));
    },
  }),

  defineRule({
    code: "SUBVENTIONNEE_DEFICIT_AVEC_EXCEDENT",
    requires: ["structure", "budgets"],
    evaluates: ({ structure, budgets }, { currentYear }) => {
      if (!isSubventionnee(structure.type)) {
        return [];
      }

      return relevantBudgets(budgets, structure, currentYear)
        .filter((budget) => {
          const resultatNet = getResultatNet(budget);

          return (
            resultatNet !== null &&
            resultatNet < 0 &&
            ((budget.excedentRecupere ?? 0) !== 0 ||
              (budget.excedentDeduit ?? 0) !== 0 ||
              (budget.fondsDedies ?? 0) !== 0)
          );
        })
        .map((budget) => onYear(budget.year));
    },
  }),

  defineRule({
    code: "SUBVENTIONNEE_EXCEDENT_AVEC_REPRISE_ETAT",
    requires: ["structure", "budgets"],
    evaluates: ({ structure, budgets }, { currentYear }) => {
      if (!isSubventionnee(structure.type)) {
        return [];
      }

      return relevantBudgets(budgets, structure, currentYear)
        .filter((budget) => {
          const resultatNet = getResultatNet(budget);

          return (
            resultatNet !== null &&
            resultatNet > 0 &&
            (budget.repriseEtat ?? 0) !== 0
          );
        })
        .map((budget) => onYear(budget.year));
    },
  }),

  defineRule({
    code: "SUBVENTIONNEE_EXCEDENT_ECART",
    requires: ["structure", "budgets"],
    evaluates: ({ structure, budgets }, { currentYear }) => {
      if (!isSubventionnee(structure.type)) {
        return [];
      }

      return relevantBudgets(budgets, structure, currentYear)
        .filter((budget) => {
          const resultatNet = getResultatNet(budget);

          return (
            resultatNet !== null &&
            resultatNet > 0 &&
            differsFrom(sumExcedents(budget), resultatNet)
          );
        })
        .map((budget) => onYear(budget.year));
    },
  }),
];
