import type { ActiviteContexte } from "@/lib/anomalies/anomalie.contexte";
import { defineRegle } from "@/lib/anomalies/anomalie.regle";
import {
  ANOMALIE_TARGET_STRUCTURE,
  ANOMALIE_YEAR_HORS_EXERCICE,
} from "@/types/anomalie.type";
import { StructureType } from "@/types/structure.type";

const SEUIL_PLACES_INDISPONIBLES_PCT = 3;
const SEUIL_PRESENCES_INDUES_PCT = 7;

const surStructure = {
  year: ANOMALIE_YEAR_HORS_EXERCICE,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

// Les activités du contexte sont le dernier millésime connu par code DNA : pas de
// désagrégation par exercice possible ici.
export const REGLES_ACTIVITE = [
  defineRegle({
    code: "ACTIVITE_PLACES_INDISPONIBLES_GT_3PCT",
    requiert: ["activites"],
    evalue: ({ activites }) =>
      activites.some(
        (activite) =>
          activite.placesIndisponibles !== null &&
          part(activite.placesIndisponibles, activite) >
            SEUIL_PLACES_INDISPONIBLES_PCT
      )
        ? [surStructure]
        : [],
  }),

  defineRegle({
    code: "ACTIVITE_PRESENCES_INDUES_GT_7PCT",
    requiert: ["structure", "activites"],
    evalue: ({ structure, activites }) => {
      if (
        structure.type !== StructureType.CADA &&
        structure.type !== StructureType.HUDA
      ) {
        return [];
      }

      return activites.some(
        (activite) =>
          part(
            (activite.presencesInduesBPI ?? 0) +
              (activite.presencesInduesDeboutees ?? 0),
            activite
          ) > SEUIL_PRESENCES_INDUES_PCT
      )
        ? [surStructure]
        : [];
    },
  }),
];

const part = (
  valeur: number,
  { placesAutorisees }: ActiviteContexte
): number =>
  placesAutorisees === null || placesAutorisees <= 0
    ? 0
    : (valeur / placesAutorisees) * 100;
