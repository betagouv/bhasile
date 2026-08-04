import { defineRegle } from "@/lib/anomalies/anomalie.regle";
import {
  budgetsPertinents,
  ecarteDe,
  estAutorisee,
  estSubventionnee,
  indicateursPertinents,
  resultatNet,
  sommeDetailAffectations,
  sommeExcedents,
} from "@/lib/anomalies/anomalie.util";
import { ANOMALIE_TARGET_STRUCTURE } from "@/types/anomalie.type";

const SEUIL_TAUX_ENCADREMENT_AUTORISEE = 20;
const SEUIL_TAUX_ENCADREMENT_SUBVENTIONNEE = 25;
const SEUIL_TAUX_ENCADREMENT_BAS = 2;
const SEUIL_COUT_JOURNALIER_BAS = 15;

const surExercice = (year: number) => ({
  year,
  targetId: ANOMALIE_TARGET_STRUCTURE,
});

export const REGLES_FINANCE = [
  defineRegle({
    code: "TAUX_ENCADREMENT_GT_SEUIL",
    requiert: ["structure", "indicateurs"],
    evalue: ({ structure, indicateurs }, { anneeCourante }) => {
      const seuil = estAutorisee(structure.type)
        ? SEUIL_TAUX_ENCADREMENT_AUTORISEE
        : estSubventionnee(structure.type)
          ? SEUIL_TAUX_ENCADREMENT_SUBVENTIONNEE
          : null;
      if (seuil === null) {
        return [];
      }

      return indicateursPertinents(indicateurs, structure, anneeCourante)
        .filter(
          (indicateur) =>
            indicateur.tauxEncadrement !== null &&
            indicateur.tauxEncadrement > seuil
        )
        .map((indicateur) => surExercice(indicateur.year));
    },
  }),

  defineRegle({
    code: "TAUX_ENCADREMENT_LT_2",
    requiert: ["structure", "indicateurs"],
    evalue: ({ structure, indicateurs }, { anneeCourante }) =>
      indicateursPertinents(indicateurs, structure, anneeCourante)
        .filter(
          (indicateur) =>
            indicateur.tauxEncadrement !== null &&
            indicateur.tauxEncadrement < SEUIL_TAUX_ENCADREMENT_BAS
        )
        .map((indicateur) => surExercice(indicateur.year)),
  }),

  defineRegle({
    code: "COUT_JOURNALIER_GT_TARIF_CIBLE",
    requiert: ["structure", "indicateurs"],
    evalue: ({ structure, indicateurs }, { anneeCourante }) => {
      const tarifCible = structure.tarifJournalierCible;
      if (tarifCible === null) {
        return [];
      }

      return indicateursPertinents(indicateurs, structure, anneeCourante)
        .filter(
          (indicateur) =>
            indicateur.coutJournalier !== null &&
            indicateur.coutJournalier > tarifCible
        )
        .map((indicateur) => surExercice(indicateur.year));
    },
  }),

  defineRegle({
    code: "COUT_JOURNALIER_LT_15",
    requiert: ["structure", "indicateurs"],
    evalue: ({ structure, indicateurs }, { anneeCourante }) =>
      indicateursPertinents(indicateurs, structure, anneeCourante)
        .filter(
          (indicateur) =>
            indicateur.coutJournalier !== null &&
            indicateur.coutJournalier < SEUIL_COUT_JOURNALIER_BAS
        )
        .map((indicateur) => surExercice(indicateur.year)),
  }),

  defineRegle({
    code: "RESULTAT_NET_EQ_0",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) =>
      budgetsPertinents(budgets, structure, anneeCourante)
        .filter((budget) => resultatNet(budget) === 0)
        .map((budget) => surExercice(budget.year)),
  }),

  defineRegle({
    code: "AFFECTATION_DETAIL_MANQUANT",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) => {
      if (!estAutorisee(structure.type)) {
        return [];
      }

      return budgetsPertinents(budgets, structure, anneeCourante)
        .filter(
          (budget) =>
            (budget.affectationReservesFondsDedies ?? 0) !== 0 &&
            sommeDetailAffectations(budget) === null
        )
        .map((budget) => surExercice(budget.year));
    },
  }),

  defineRegle({
    code: "AFFECTATION_DETAIL_ECART",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) => {
      if (!estAutorisee(structure.type)) {
        return [];
      }

      return budgetsPertinents(budgets, structure, anneeCourante)
        .filter((budget) => {
          const affectation = budget.affectationReservesFondsDedies ?? 0;
          const detail = sommeDetailAffectations(budget);

          return (
            affectation !== 0 &&
            detail !== null &&
            ecarteDe(detail, affectation)
          );
        })
        .map((budget) => surExercice(budget.year));
    },
  }),

  defineRegle({
    code: "REPRISE_PLUS_AFFECTATION_ECART",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) => {
      if (!estAutorisee(structure.type)) {
        return [];
      }

      return budgetsPertinents(budgets, structure, anneeCourante)
        .filter((budget) => {
          const resultat = resultatNet(budget);

          return (
            resultat !== null &&
            budget.affectationReservesFondsDedies !== null &&
            ecarteDe(
              (budget.repriseEtat ?? 0) + budget.affectationReservesFondsDedies,
              resultat
            )
          );
        })
        .map((budget) => surExercice(budget.year));
    },
  }),

  defineRegle({
    code: "REPRISE_ETAT_SIGNE_INVERSE",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) => {
      if (!estAutorisee(structure.type)) {
        return [];
      }

      return budgetsPertinents(budgets, structure, anneeCourante)
        .filter((budget) => {
          const resultat = resultatNet(budget);
          const affectation = budget.affectationReservesFondsDedies;

          return (
            resultat !== null &&
            budget.repriseEtat !== null &&
            affectation !== null &&
            ecarteDe(budget.repriseEtat + affectation, resultat) &&
            !ecarteDe(-budget.repriseEtat + affectation, resultat)
          );
        })
        .map((budget) => surExercice(budget.year));
    },
  }),

  defineRegle({
    code: "SUBVENTIONNEE_DEFICIT_AVEC_EXCEDENT",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) => {
      if (!estSubventionnee(structure.type)) {
        return [];
      }

      return budgetsPertinents(budgets, structure, anneeCourante)
        .filter((budget) => {
          const resultat = resultatNet(budget);

          return (
            resultat !== null &&
            resultat < 0 &&
            ((budget.excedentRecupere ?? 0) !== 0 ||
              (budget.excedentDeduit ?? 0) !== 0 ||
              (budget.fondsDedies ?? 0) !== 0)
          );
        })
        .map((budget) => surExercice(budget.year));
    },
  }),

  defineRegle({
    code: "SUBVENTIONNEE_EXCEDENT_AVEC_REPRISE_ETAT",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) => {
      if (!estSubventionnee(structure.type)) {
        return [];
      }

      return budgetsPertinents(budgets, structure, anneeCourante)
        .filter((budget) => {
          const resultat = resultatNet(budget);

          return (
            resultat !== null && resultat > 0 && (budget.repriseEtat ?? 0) !== 0
          );
        })
        .map((budget) => surExercice(budget.year));
    },
  }),

  defineRegle({
    code: "SUBVENTIONNEE_EXCEDENT_ECART",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) => {
      if (!estSubventionnee(structure.type)) {
        return [];
      }

      return budgetsPertinents(budgets, structure, anneeCourante)
        .filter((budget) => {
          const resultat = resultatNet(budget);

          return (
            resultat !== null &&
            resultat > 0 &&
            ecarteDe(sommeExcedents(budget), resultat)
          );
        })
        .map((budget) => surExercice(budget.year));
    },
  }),
];
