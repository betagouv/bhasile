import {
  isStructureEligibleForActiviteIndisponibilite,
  isStructureEligibleForActivitePresencesIndues,
} from "@/app/utils/structure.util";
import { StructureType } from "@/generated/prisma/client";
import {
  ActiviteByMonthStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import { getMonthKey, monthKeyToDate } from "../shared/utils";
import type {
  StatistiqueDbActivite,
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
} from "../shared/db.type";

type DnaEligibility = {
  indisponibilite: Set<string>;
  presencesIndues: Set<string>;
};

type MonthAccumulator = {
  placesEnregistreesDna: number;
  placesAutoriseesIndispo: number;
  placesIndisponibles: number;
  placesAutoriseesPresencesIndues: number;
  presencesInduesBPI: number;
  presencesInduesDeboutees: number;
};

const emptyMonthAccumulator = (): MonthAccumulator => ({
  placesEnregistreesDna: 0,
  placesAutoriseesIndispo: 0,
  placesIndisponibles: 0,
  placesAutoriseesPresencesIndues: 0,
  presencesInduesBPI: 0,
  presencesInduesDeboutees: 0,
});

const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;

export const buildDnaEligibilityByActiviteScope = (
  dnaLinks: StatistiqueDbDnaLink[],
  structures: StatistiqueDbStructure[]
): DnaEligibility => {
  const structureTypeById = new Map(
    structures.map((structure) => [structure.id, structure.type])
  );
  const indisponibilite = new Set<string>();
  const presencesIndues = new Set<string>();

  for (const link of dnaLinks) {
    if (link.structureId === null) {
      continue;
    }
    const type = structureTypeById.get(link.structureId) as
      | StructureType
      | undefined;
    if (!type) {
      continue;
    }
    if (isStructureEligibleForActiviteIndisponibilite(type)) {
      indisponibilite.add(link.dna.code);
    }
    if (isStructureEligibleForActivitePresencesIndues(type)) {
      presencesIndues.add(link.dna.code);
    }
  }

  return { indisponibilite, presencesIndues };
};

const toMonthStat = (key: string, acc: MonthAccumulator): ActiviteByMonthStat => {
  const presencesInduesTotal = acc.presencesInduesBPI + acc.presencesInduesDeboutees;

  return {
    date: monthKeyToDate(key),
    placesEnregistreesDna: acc.placesEnregistreesDna,
    placesIndisponibles: acc.placesIndisponibles,
    tauxIndisponibilite: ratio(
      acc.placesIndisponibles,
      acc.placesAutoriseesIndispo
    ),
    presencesInduesBPI: acc.presencesInduesBPI,
    tauxPresencesInduesBPI: ratio(
      acc.presencesInduesBPI,
      acc.placesAutoriseesPresencesIndues
    ),
    presencesInduesDeboutees: acc.presencesInduesDeboutees,
    tauxPresencesInduesDeboutees: ratio(
      acc.presencesInduesDeboutees,
      acc.placesAutoriseesPresencesIndues
    ),
    presencesInduesTotal,
    tauxPresencesInduesTotal: ratio(
      presencesInduesTotal,
      acc.placesAutoriseesPresencesIndues
    ),
  };
};

export const computeActiviteStatistiques = (
  activites: StatistiqueDbActivite[],
  eligibility: DnaEligibility
): StatistiqueApiRead["activite"] => {
  // TODO(fermeture): exclure les structures avec fermeture effective (filtre global périmètre)
  // TODO(actualisation): exposer updatedAt quand les formulaires d'actualisation seront disponibles

  const byMonth = new Map<string, MonthAccumulator>();

  for (const activite of activites) {
    if (!activite.dnaCode) {
      continue;
    }

    const key = getMonthKey(new Date(activite.date));
    const acc = byMonth.get(key) ?? emptyMonthAccumulator();
    const placesAutorisees = activite.placesAutorisees ?? 0;

    acc.placesEnregistreesDna += placesAutorisees;

    if (eligibility.indisponibilite.has(activite.dnaCode)) {
      acc.placesAutoriseesIndispo += placesAutorisees;
      acc.placesIndisponibles += activite.placesIndisponibles ?? 0;
    }

    if (eligibility.presencesIndues.has(activite.dnaCode)) {
      acc.placesAutoriseesPresencesIndues += placesAutorisees;
      acc.presencesInduesBPI += activite.presencesInduesBPI ?? 0;
      acc.presencesInduesDeboutees += activite.presencesInduesDeboutees ?? 0;
    }

    byMonth.set(key, acc);
  }

  return {
    byMonth: [...byMonth.entries()]
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, acc]) => toMonthStat(key, acc)),
  };
};
