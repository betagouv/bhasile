import type { TypologieContexte } from "@/lib/anomalies/anomalie.contexte";
import { defineRegle } from "@/lib/anomalies/anomalie.regle";
import {
  SEUIL_ECART_PLACES_ADRESSES_PCT,
  typologiesEchues,
} from "@/lib/anomalies/anomalie.util";
import {
  ANOMALIE_TARGET_STRUCTURE,
  ANOMALIE_YEAR_HORS_EXERCICE,
} from "@/types/anomalie.type";

const surStructure = {
  year: ANOMALIE_YEAR_HORS_EXERCICE,
  targetId: ANOMALIE_TARGET_STRUCTURE,
};

export const REGLES_PLACES = [
  defineRegle({
    code: "PLACES_LABELLISEES_GT_AUTORISEES",
    requiert: ["typologies"],
    evalue: ({ typologies }, { anneeCourante }) =>
      exercicesEnDepassement(typologies, anneeCourante, "lgbt"),
  }),

  defineRegle({
    code: "PLACES_SPECIALISEES_GT_AUTORISEES",
    requiert: ["typologies"],
    evalue: ({ typologies }, { anneeCourante }) =>
      exercicesEnDepassement(typologies, anneeCourante, "fvvTeh"),
  }),

  defineRegle({
    code: "PLACES_PMR_GT_AUTORISEES",
    requiert: ["typologies"],
    evalue: ({ typologies }, { anneeCourante }) =>
      exercicesEnDepassement(typologies, anneeCourante, "pmr"),
  }),

  // L'indicateur vient de la version active de la structure, les places du millésime :
  // la comparaison se fait exercice par exercice.
  defineRegle({
    code: "INCOHERENCE_LGBT_PLACES",
    requiert: ["structure", "typologies"],
    evalue: ({ structure, typologies }, { anneeCourante }) =>
      exercicesIncoherents(typologies, anneeCourante, "lgbt", structure.lgbt),
  }),

  defineRegle({
    code: "INCOHERENCE_FVVTEH_PLACES",
    requiert: ["structure", "typologies"],
    evalue: ({ structure, typologies }, { anneeCourante }) =>
      exercicesIncoherents(typologies, anneeCourante, "fvvTeh", structure.fvvTeh),
  }),

  defineRegle({
    code: "PLACES_ADRESSES_ECART_STRUCTURE",
    requiert: ["structure", "adresses"],
    evalue: ({ structure, adresses }) => {
      const placesStructure = structure.placesAutorisees ?? 0;
      if (placesStructure === 0) {
        return [];
      }

      const placesAdresses = adresses.reduce(
        (total, adresse) => total + (adresse.placesAutorisees ?? 0),
        0
      );
      const ecartPct =
        (Math.abs(placesStructure - placesAdresses) / placesStructure) * 100;

      return ecartPct > SEUIL_ECART_PLACES_ADRESSES_PCT ? [surStructure] : [];
    },
  }),
];

type ChampPlaces = "pmr" | "lgbt" | "fvvTeh";

const exercicesEnDepassement = (
  typologies: TypologieContexte[],
  anneeCourante: number,
  champ: ChampPlaces
) =>
  typologiesEchues(typologies, anneeCourante)
    .filter(
      (typologie) =>
        typologie[champ] !== null &&
        typologie.placesAutorisees !== null &&
        typologie[champ] > typologie.placesAutorisees
    )
    .map((typologie) => ({
      year: typologie.year,
      targetId: ANOMALIE_TARGET_STRUCTURE,
    }));

const exercicesIncoherents = (
  typologies: TypologieContexte[],
  anneeCourante: number,
  champ: ChampPlaces,
  indicateur: boolean | null
) =>
  typologiesEchues(typologies, anneeCourante)
    .filter((typologie) => indicateurIncoherent(indicateur, typologie[champ] ?? 0))
    .map((typologie) => ({
      year: typologie.year,
      targetId: ANOMALIE_TARGET_STRUCTURE,
    }));

const indicateurIncoherent = (
  indicateur: boolean | null,
  places: number
): boolean =>
  (indicateur === true && places === 0) || (indicateur === false && places > 0);
