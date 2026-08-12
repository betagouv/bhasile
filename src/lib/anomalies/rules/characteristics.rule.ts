import { defineRule } from "@/lib/anomalies/anomalie.rule";
import {
  ANOMALIE_NO_YEAR,
  ANOMALIE_TARGET_STRUCTURE,
} from "@/types/anomalie.type";

const onStructure = {
  year: ANOMALIE_NO_YEAR,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

export const CHARACTERISTICS_RULES = [
  defineRule({
    code: "DEPARTEMENT_INCOHERENT_CODE_DNA",
    requires: ["structure", "dnas"],
    evaluates: ({ structure, dnas }) => {
      const departement = structure.departementAdministratif?.trim();
      if (departement === undefined || departement === "") {
        return [];
      }

      return dnas
        .filter(
          (dna) => dna.code.slice(1, 1 + departement.length) !== departement
        )
        .map((dna) => ({
          year: ANOMALIE_NO_YEAR,
          targetId: dna.id,
        }));
    },
  }),

  defineRule({
    code: "MULTI_DNA",
    requires: ["dnas"],
    evaluates: ({ dnas }) =>
      new Set(dnas.map((dna) => dna.id)).size > 1 ? [onStructure] : [],
  }),

  defineRule({
    code: "CPOM_MONO_STRUCTURE",
    requires: ["cpoms"],
    evaluates: ({ cpoms }) =>
      cpoms
        .filter((cpom) => cpom.structuresCount <= 1)
        .map((cpom) => ({
          year: ANOMALIE_NO_YEAR,
          targetId: cpom.id,
        })),
  }),
];
