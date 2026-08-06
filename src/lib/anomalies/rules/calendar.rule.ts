import { defineRule } from "@/lib/anomalies/anomalie.rule";
import {
  actesWithDates,
  durationInYears,
  isAutorisee,
  isSubventionnee,
  maxDate,
  minDate,
} from "@/lib/anomalies/anomalie.util";
import {
  ANOMALIE_NO_YEAR,
  ANOMALIE_TARGET_STRUCTURE,
} from "@/types/anomalie.type";

const onStructure = {
  year: ANOMALIE_NO_YEAR,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

export const CALENDAR_RULES = [
  defineRule({
    code: "AUTORISATION_DUREE_NOT_15Y",
    requires: ["structure", "actes"],
    evaluates: ({ structure, actes }) => {
      if (!isAutorisee(structure.type)) {
        return [];
      }

      return actesWithDates(actes, "ARRETE_AUTORISATION")
        .filter((acte) => durationInYears(acte) !== 15)
        .map((acte) => ({
          year: ANOMALIE_NO_YEAR,
          targetId: acte.id,
        }));
    },
  }),

  defineRule({
    code: "CONVENTION_AUTORISEE_DUREE_NOT_5Y",
    requires: ["structure", "actes"],
    evaluates: ({ structure, actes }) => {
      if (!isAutorisee(structure.type)) {
        return [];
      }

      return actesWithDates(actes, "CONVENTION")
        .filter((acte) => durationInYears(acte) !== 5)
        .map((acte) => ({
          year: ANOMALIE_NO_YEAR,
          targetId: acte.id,
        }));
    },
  }),

  defineRule({
    code: "CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y",
    requires: ["structure", "actes"],
    evaluates: ({ structure, actes }) => {
      if (!isSubventionnee(structure.type)) {
        return [];
      }

      return actesWithDates(actes, "CONVENTION")
        .filter((acte) => durationInYears(acte) > 3)
        .map((acte) => ({
          year: ANOMALIE_NO_YEAR,
          targetId: acte.id,
        }));
    },
  }),

  defineRule({
    code: "CONVENTION_HORS_PERIODE_AUTORISATION",
    requires: ["structure", "actes"],
    evaluates: ({ structure, actes }) => {
      const autorisations = actesWithDates(actes, "ARRETE_AUTORISATION");
      if (!isAutorisee(structure.type) || autorisations.length === 0) {
        return [];
      }

      return actesWithDates(actes, "CONVENTION")
        .filter(
          (convention) =>
            !autorisations.some(
              (autorisation) =>
                convention.startDate >= autorisation.startDate &&
                convention.endDate <= autorisation.endDate
            )
        )
        .map((convention) => ({
          year: ANOMALIE_NO_YEAR,
          targetId: convention.id,
        }));
    },
  }),

  defineRule({
    code: "CONVENTION_MANQUANTE_OU_EXPIREE",
    requires: ["structure", "actes"],
    evaluates: ({ structure, actes }) =>
      isAutorisee(structure.type) &&
      actesWithDates(actes, "CONVENTION").length === 0
        ? [onStructure]
        : [],
  }),

  defineRule({
    code: "CONVENTION_DATES_DIFFERENTES_ACTES",
    requires: ["structure", "actes"],
    evaluates: ({ structure, actes }) => {
      const conventions = actesWithDates(actes, "CONVENTION");
      const start = minDate(conventions.map((acte) => acte.startDate));
      const end = maxDate(conventions.map((acte) => acte.endDate));

      if (start === null && end === null) {
        return [];
      }

      return sameInstant(start, structure.debutConvention) &&
        sameInstant(end, structure.finConvention)
        ? []
        : [onStructure];
    },
  }),

  defineRule({
    code: "AUTORISATION_DATES_DIFFERENTES_ACTES",
    requires: ["structure", "actes"],
    evaluates: ({ structure, actes }) => {
      if (!isAutorisee(structure.type)) {
        return [];
      }

      const autorisations = actesWithDates(actes, "ARRETE_AUTORISATION");
      const start = minDate(autorisations.map((acte) => acte.startDate));
      const end = maxDate(autorisations.map((acte) => acte.endDate));

      if (start === null && end === null) {
        return [];
      }

      return sameInstant(start, structure.debutPeriodeAutorisation) &&
        sameInstant(end, structure.finPeriodeAutorisation)
        ? []
        : [onStructure];
    },
  }),

  defineRule({
    code: "EVALUATION_HORS_DELAI",
    requires: ["structure", "actes", "evaluations"],
    evaluates: ({ structure, actes, evaluations }) => {
      if (isSubventionnee(structure.type)) {
        return [];
      }

      const finConvention = maxDate(
        actesWithDates(actes, "CONVENTION").map((acte) => acte.endDate)
      );
      if (finConvention === null) {
        return [];
      }

      const lastEvaluation = maxDate(
        evaluations
          .map((evaluation) => evaluation.date)
          .filter((date): date is Date => date !== null)
      );
      if (lastEvaluation === null) {
        return [onStructure];
      }

      const limit = new Date(finConvention);
      limit.setFullYear(limit.getFullYear() - 5);

      return lastEvaluation < limit ? [onStructure] : [];
    },
  }),
];

const sameInstant = (gauche: Date | null, droite: Date | null): boolean =>
  (gauche?.getTime() ?? null) === (droite?.getTime() ?? null);
