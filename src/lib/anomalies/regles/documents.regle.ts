import type { ActeContexte } from "@/lib/anomalies/anomalie.contexte";
import { defineRegle } from "@/lib/anomalies/anomalie.regle";
import { estAutorisee } from "@/lib/anomalies/anomalie.util";
import {
  ANOMALIE_TARGET_STRUCTURE,
  ANOMALIE_YEAR_HORS_EXERCICE,
} from "@/types/anomalie.type";

const surStructure = {
  year: ANOMALIE_YEAR_HORS_EXERCICE,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

export const REGLES_DOCUMENTS = [
  defineRegle({
    code: "DOCUMENT_CONVENTION_MANQUANT",
    requiert: ["actes"],
    evalue: ({ actes }) =>
      aUnDocument(actes, "CONVENTION") ? [] : [surStructure],
  }),

  defineRegle({
    code: "DOCUMENT_AUTORISATION_MANQUANT",
    requiert: ["structure", "actes"],
    evalue: ({ structure, actes }) =>
      estAutorisee(structure.type) && !aUnDocument(actes, "ARRETE_AUTORISATION")
        ? [surStructure]
        : [],
  }),

  defineRegle({
    code: "DOCUMENT_CPOM_MANQUANT",
    requiert: ["cpoms"],
    evalue: ({ cpoms }) =>
      cpoms
        .filter((cpom) => !cpom.hasConventionDocument)
        .map((cpom) => ({
          year: ANOMALIE_YEAR_HORS_EXERCICE,
          targetId: cpom.id,
        })),
  }),
];

const aUnDocument = (
  actes: ActeContexte[],
  category: ActeContexte["category"]
): boolean =>
  actes.some(
    (acte) =>
      acte.category === category &&
      acte.parentId === null &&
      acte.isMissing !== true &&
      acte.hasFile
  );
