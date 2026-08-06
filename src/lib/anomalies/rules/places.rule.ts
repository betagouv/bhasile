import type { TypologieContext } from "@/lib/anomalies/anomalie.context.type";
import { defineRule } from "@/lib/anomalies/anomalie.rule";
import {
  pastTypologies,
  PLACES_ADRESSES_GAP_THRESHOLD_PCT,
} from "@/lib/anomalies/anomalie.util";
import {
  ANOMALIE_NO_YEAR,
  ANOMALIE_TARGET_STRUCTURE,
} from "@/types/anomalie.type";

const onStructure = {
  year: ANOMALIE_NO_YEAR,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

export const PLACES_RULES = [
  defineRule({
    code: "PLACES_LABELLISEES_GT_AUTORISEES",
    requires: ["typologies"],
    evaluates: ({ typologies }, { currentYear }) =>
      yearsOverLimit(typologies, currentYear, "lgbt"),
  }),

  defineRule({
    code: "PLACES_SPECIALISEES_GT_AUTORISEES",
    requires: ["typologies"],
    evaluates: ({ typologies }, { currentYear }) =>
      yearsOverLimit(typologies, currentYear, "fvvTeh"),
  }),

  defineRule({
    code: "PLACES_PMR_GT_AUTORISEES",
    requires: ["typologies"],
    evaluates: ({ typologies }, { currentYear }) =>
      yearsOverLimit(typologies, currentYear, "pmr"),
  }),

  // L'indicateur vient de la version active de la structure et les places du millésime : la comparaison se fait exercice par exercice.
  // TODO : vérifier que cet indicateur est pertinent sans historique
  defineRule({
    code: "INCOHERENCE_LGBT_PLACES",
    requires: ["structure", "typologies"],
    evaluates: ({ structure, typologies }, { currentYear }) =>
      inconsistentYears(typologies, currentYear, "lgbt", structure.lgbt),
  }),

  defineRule({
    code: "INCOHERENCE_FVVTEH_PLACES",
    requires: ["structure", "typologies"],
    evaluates: ({ structure, typologies }, { currentYear }) =>
      inconsistentYears(typologies, currentYear, "fvvTeh", structure.fvvTeh),
  }),

  defineRule({
    code: "PLACES_ADRESSES_ECART_STRUCTURE",
    requires: ["structure", "adresses"],
    evaluates: ({ structure, adresses }) => {
      const placesStructure = structure.placesAutorisees ?? 0;
      if (placesStructure === 0) {
        return [];
      }

      const placesAdresses = adresses.reduce(
        (total, adresse) => total + (adresse.placesAutorisees ?? 0),
        0
      );
      const gapPct =
        (Math.abs(placesStructure - placesAdresses) / placesStructure) * 100;

      return gapPct > PLACES_ADRESSES_GAP_THRESHOLD_PCT ? [onStructure] : [];
    },
  }),
];

type PlacesField = "pmr" | "lgbt" | "fvvTeh";

const yearsOverLimit = (
  typologies: TypologieContext[],
  currentYear: number,
  field: PlacesField
) =>
  pastTypologies(typologies, currentYear)
    .filter(
      (typologie) =>
        typologie[field] !== null &&
        typologie.placesAutorisees !== null &&
        typologie[field] > typologie.placesAutorisees
    )
    .map((typologie) => ({
      year: typologie.year,
      targetId: ANOMALIE_TARGET_STRUCTURE,
    }));

const inconsistentYears = (
  typologies: TypologieContext[],
  currentYear: number,
  field: PlacesField,
  indicateur: boolean | null
) =>
  pastTypologies(typologies, currentYear)
    .filter((typologie) =>
      isIndicateurInconsistent(indicateur, typologie[field] ?? 0)
    )
    .map((typologie) => ({
      year: typologie.year,
      targetId: ANOMALIE_TARGET_STRUCTURE,
    }));

const isIndicateurInconsistent = (
  indicateur: boolean | null,
  places: number
): boolean =>
  (indicateur === true && places === 0) || (indicateur === false && places > 0);
