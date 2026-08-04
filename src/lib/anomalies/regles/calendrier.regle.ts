import type { ActeContexte } from "@/lib/anomalies/anomalie.contexte";
import { defineRegle } from "@/lib/anomalies/anomalie.regle";
import { estAutorisee, estSubventionnee } from "@/lib/anomalies/anomalie.util";
import { ANOMALIE_YEAR_HORS_EXERCICE } from "@/types/anomalie.type";

export const REGLES_CALENDRIER = [
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
];

const actesDatesConnues = (
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

const dureeEnAnnees = ({ startDate, endDate }: ActeDate): number =>
  endDate.getFullYear() - startDate.getFullYear();

type ActeDate = ActeContexte & { startDate: Date; endDate: Date };
