import { Activite, Prisma } from "@/generated/prisma/client";

import {
  findOne,
  getLatestPlacesAutoriseesPerStructure,
} from "./structure.repository";

export const getFullStructure = async (id: number) => {
  const structure = await findOne(id);
  const aggregatedActivites = getAggregatedActivites(structure);

  const aggregatedEIGs = structure.dnaStructures.flatMap(
    (dnaStructure) => dnaStructure.dna.evenementsIndesirablesGraves
  );

  return {
    ...structure,
    activites: aggregatedActivites,
    evenementsIndesirablesGraves: aggregatedEIGs,
  };
};

type StructureWithActivites = Prisma.StructureGetPayload<{
  include: {
    dnaStructures: { include: { dna: { include: { activites: true } } } };
  };
}>;

type AggregatedActivite = Omit<Activite, "dnaCode" | "structureDnaCode">;

const getAggregatedActivites = (
  structure: StructureWithActivites
): AggregatedActivite[] => {
  const aggregatedActivites = structure.dnaStructures
    .flatMap((dnaStructure) => dnaStructure.dna.activites)
    .reduce<Record<string, AggregatedActivite>>((accumulator, current) => {
      const dateKey = new Date(current.date).toISOString().split("T")[0];

      if (!accumulator[dateKey]) {
        accumulator[dateKey] = {
          id: current.id,
          date: current.date,
          placesAutorisees: current.placesAutorisees,
          desinsectisation: current.desinsectisation,
          remiseEnEtat: current.remiseEnEtat,
          sousOccupation: current.sousOccupation,
          placesIndisponibles: current.placesIndisponibles,
          placesOccupees: current.placesOccupees,
          travaux: current.travaux,
          placesVacantes: current.placesVacantes,
          presencesInduesBPI: current.presencesInduesBPI,
          presencesInduesDeboutees: current.presencesInduesDeboutees,
        };
      } else {
        const currentActivite = Object.keys(current) as Array<keyof Activite>;
        currentActivite.forEach((key) => {
          if (
            typeof current[key] === "number" &&
            key in accumulator[dateKey] &&
            key !== "id"
          ) {
            (accumulator[dateKey][key as keyof AggregatedActivite] as number) +=
              current[key];
          }
        });
      }
      return accumulator;
    }, {});

  return Object.values(aggregatedActivites).map((activite) => ({
    ...activite,
    presencesIndues:
      (activite?.presencesInduesBPI || 0) +
      (activite?.presencesInduesDeboutees || 0),
  }));
};

export const getMaxPlacesAutorisees = async (): Promise<number> => {
  const latestPlacesAutoriseesOfEveryStructure =
    await getLatestPlacesAutoriseesPerStructure();
  return Math.max(...latestPlacesAutoriseesOfEveryStructure);
};

export const getMinPlacesAutorisees = async (): Promise<number> => {
  const latestPlacesAutoriseesOfEveryStructure =
    await getLatestPlacesAutoriseesPerStructure();
  return Math.min(...latestPlacesAutoriseesOfEveryStructure);
};
