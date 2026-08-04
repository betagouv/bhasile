import { defineRegle } from "@/lib/anomalies/anomalie.regle";
import {
  actesDatesConnues,
  dureeEnAnnees,
  estAutorisee,
  estSubventionnee,
  maxDate,
  minDate,
} from "@/lib/anomalies/anomalie.util";
import {
  ANOMALIE_TARGET_STRUCTURE,
  ANOMALIE_YEAR_HORS_EXERCICE,
} from "@/types/anomalie.type";

const surStructure = {
  year: ANOMALIE_YEAR_HORS_EXERCICE,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

export const REGLES_CALENDRIER = [
  defineRegle({
    code: "AUTORISATION_DUREE_NOT_15Y",
    requiert: ["structure", "actes"],
    evalue: ({ structure, actes }) => {
      if (!estAutorisee(structure.type)) {
        return [];
      }

      return actesDatesConnues(actes, "ARRETE_AUTORISATION")
        .filter((acte) => dureeEnAnnees(acte) !== 15)
        .map((acte) => ({
          year: ANOMALIE_YEAR_HORS_EXERCICE,
          targetId: acte.id,
        }));
    },
  }),

  defineRegle({
    code: "CONVENTION_AUTORISEE_DUREE_NOT_5Y",
    requiert: ["structure", "actes"],
    evalue: ({ structure, actes }) => {
      if (!estAutorisee(structure.type)) {
        return [];
      }

      return actesDatesConnues(actes, "CONVENTION")
        .filter((acte) => dureeEnAnnees(acte) !== 5)
        .map((acte) => ({
          year: ANOMALIE_YEAR_HORS_EXERCICE,
          targetId: acte.id,
        }));
    },
  }),

  defineRegle({
    code: "CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y",
    requiert: ["structure", "actes"],
    evalue: ({ structure, actes }) => {
      if (!estSubventionnee(structure.type)) {
        return [];
      }

      return actesDatesConnues(actes, "CONVENTION")
        .filter((acte) => dureeEnAnnees(acte) > 3)
        .map((acte) => ({
          year: ANOMALIE_YEAR_HORS_EXERCICE,
          targetId: acte.id,
        }));
    },
  }),

  defineRegle({
    code: "CONVENTION_HORS_PERIODE_AUTORISATION",
    requiert: ["structure", "actes"],
    evalue: ({ structure, actes }) => {
      const autorisations = actesDatesConnues(actes, "ARRETE_AUTORISATION");
      if (!estAutorisee(structure.type) || autorisations.length === 0) {
        return [];
      }

      return actesDatesConnues(actes, "CONVENTION")
        .filter(
          (convention) =>
            !autorisations.some(
              (autorisation) =>
                convention.startDate >= autorisation.startDate &&
                convention.endDate <= autorisation.endDate
            )
        )
        .map((convention) => ({
          year: ANOMALIE_YEAR_HORS_EXERCICE,
          targetId: convention.id,
        }));
    },
  }),

  defineRegle({
    code: "CONVENTION_MANQUANTE_OU_EXPIREE",
    requiert: ["structure", "actes"],
    evalue: ({ structure, actes }) =>
      estAutorisee(structure.type) &&
      actesDatesConnues(actes, "CONVENTION").length === 0
        ? [surStructure]
        : [],
  }),

  defineRegle({
    code: "CONVENTION_DATES_DIFFERENTES_ACTES",
    requiert: ["structure", "actes"],
    evalue: ({ structure, actes }) => {
      const conventions = actesDatesConnues(actes, "CONVENTION");
      const debut = minDate(conventions.map((acte) => acte.startDate));
      const fin = maxDate(conventions.map((acte) => acte.endDate));

      if (debut === null && fin === null) {
        return [];
      }

      return memeInstant(debut, structure.debutConvention) &&
        memeInstant(fin, structure.finConvention)
        ? []
        : [surStructure];
    },
  }),

  defineRegle({
    code: "AUTORISATION_DATES_DIFFERENTES_ACTES",
    requiert: ["structure", "actes"],
    evalue: ({ structure, actes }) => {
      if (!estAutorisee(structure.type)) {
        return [];
      }

      const autorisations = actesDatesConnues(actes, "ARRETE_AUTORISATION");
      const debut = minDate(autorisations.map((acte) => acte.startDate));
      const fin = maxDate(autorisations.map((acte) => acte.endDate));

      if (debut === null && fin === null) {
        return [];
      }

      return memeInstant(debut, structure.debutPeriodeAutorisation) &&
        memeInstant(fin, structure.finPeriodeAutorisation)
        ? []
        : [surStructure];
    },
  }),

  defineRegle({
    code: "EVALUATION_HORS_DELAI",
    requiert: ["structure", "actes", "evaluations"],
    evalue: ({ structure, actes, evaluations }) => {
      if (estSubventionnee(structure.type)) {
        return [];
      }

      const finConvention = maxDate(
        actesDatesConnues(actes, "CONVENTION").map((acte) => acte.endDate)
      );
      if (finConvention === null) {
        return [];
      }

      const derniereEvaluation = maxDate(
        evaluations
          .map((evaluation) => evaluation.date)
          .filter((date): date is Date => date !== null)
      );
      if (derniereEvaluation === null) {
        return [surStructure];
      }

      const limite = new Date(finConvention);
      limite.setFullYear(limite.getFullYear() - 5);

      return derniereEvaluation < limite ? [surStructure] : [];
    },
  }),
];

const memeInstant = (gauche: Date | null, droite: Date | null): boolean =>
  (gauche?.getTime() ?? null) === (droite?.getTime() ?? null);
