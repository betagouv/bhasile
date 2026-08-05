import type { ActiviteContext } from "@/lib/anomalies/anomalie.context";
import { defineRule } from "@/lib/anomalies/anomalie.rule";
import {
  ANOMALIE_NO_YEAR,
  ANOMALIE_TARGET_STRUCTURE,
} from "@/types/anomalie.type";
import { StructureType } from "@/types/structure.type";

const PLACES_INDISPONIBLES_THRESHOLD_PCT = 3;
const PRESENCES_INDUES_THRESHOLD_PCT = 7;

const onStructure = {
  year: ANOMALIE_NO_YEAR,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

// Les activités du contexte sont le dernier millésime connu par code DNA : pas de
// désagrégation par exercice possible ici.
export const ACTIVITE_RULES = [
  defineRule({
    code: "ACTIVITE_PLACES_INDISPONIBLES_GT_3PCT",
    requires: ["activites"],
    evaluates: ({ activites }) =>
      activites.some(
        (activite) =>
          activite.placesIndisponibles !== null &&
          share(activite.placesIndisponibles, activite) >
            PLACES_INDISPONIBLES_THRESHOLD_PCT
      )
        ? [onStructure]
        : [],
  }),

  defineRule({
    code: "ACTIVITE_PRESENCES_INDUES_GT_7PCT",
    requires: ["structure", "activites"],
    evaluates: ({ structure, activites }) => {
      if (
        structure.type !== StructureType.CADA &&
        structure.type !== StructureType.HUDA
      ) {
        return [];
      }

      return activites.some(
        (activite) =>
          share(
            (activite.presencesInduesBPI ?? 0) +
              (activite.presencesInduesDeboutees ?? 0),
            activite
          ) > PRESENCES_INDUES_THRESHOLD_PCT
      )
        ? [onStructure]
        : [];
    },
  }),
];

const share = (value: number, { placesAutorisees }: ActiviteContext): number =>
  placesAutorisees === null || placesAutorisees <= 0
    ? 0
    : (value / placesAutorisees) * 100;
