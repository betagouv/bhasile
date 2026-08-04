import { defineRegle } from "@/lib/anomalies/anomalie.regle";
import {
  ANOMALIE_TARGET_STRUCTURE,
  ANOMALIE_YEAR_HORS_EXERCICE,
} from "@/types/anomalie.type";

const surStructure = {
  year: ANOMALIE_YEAR_HORS_EXERCICE,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

export const REGLES_CARACTERISTIQUES = [
  defineRegle({
    code: "DEPARTEMENT_INCOHERENT_CODE_DNA",
    requiert: ["structure", "dnas"],
    evalue: ({ structure, dnas }) => {
      const departement = structure.departementAdministratif?.trim();
      if (departement === undefined || departement === "") {
        return [];
      }

      return dnas.some(
        (dna) => dna.code.slice(1, 1 + departement.length) !== departement
      )
        ? [surStructure]
        : [];
    },
  }),

  defineRegle({
    code: "MULTI_DNA",
    requiert: ["dnas"],
    evalue: ({ dnas }) =>
      new Set(dnas.map((dna) => dna.id)).size > 1 ? [surStructure] : [],
  }),

  defineRegle({
    code: "CPOM_MONO_STRUCTURE",
    requiert: ["cpoms"],
    evalue: ({ cpoms }) =>
      cpoms
        .filter((cpom) => cpom.structuresCount <= 1)
        .map((cpom) => ({
          year: ANOMALIE_YEAR_HORS_EXERCICE,
          targetId: cpom.id,
        })),
  }),
];
