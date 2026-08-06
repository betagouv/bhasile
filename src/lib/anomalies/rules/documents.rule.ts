import type { ActeContext } from "@/lib/anomalies/anomalie.context.type";
import { defineRule } from "@/lib/anomalies/anomalie.rule";
import { isAutorisee } from "@/lib/anomalies/anomalie.util";
import {
  ANOMALIE_NO_YEAR,
  ANOMALIE_TARGET_STRUCTURE,
} from "@/types/anomalie.type";

const onStructure = {
  year: ANOMALIE_NO_YEAR,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

export const DOCUMENTS_RULES = [
  defineRule({
    code: "DOCUMENT_CONVENTION_MANQUANT",
    requires: ["actes"],
    evaluates: ({ actes }) =>
      hasDocument(actes, "CONVENTION") ? [] : [onStructure],
  }),

  defineRule({
    code: "DOCUMENT_AUTORISATION_MANQUANT",
    requires: ["structure", "actes"],
    evaluates: ({ structure, actes }) =>
      isAutorisee(structure.type) && !hasDocument(actes, "ARRETE_AUTORISATION")
        ? [onStructure]
        : [],
  }),

  defineRule({
    code: "DOCUMENT_CPOM_MANQUANT",
    requires: ["cpoms"],
    evaluates: ({ cpoms }) =>
      cpoms
        .filter((cpom) => !cpom.hasConventionDocument)
        .map((cpom) => ({
          year: ANOMALIE_NO_YEAR,
          targetId: cpom.id,
        })),
  }),
];

const hasDocument = (
  actes: ActeContext[],
  category: ActeContext["category"]
): boolean =>
  actes.some(
    (acte) =>
      acte.category === category &&
      acte.parentId === null &&
      acte.isMissing !== true &&
      acte.hasFile
  );
