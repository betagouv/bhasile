import { processActivitesForStructure } from "../activites/activite.service";
import {
  findOne,
  getLatestPlacesAutoriseesPerStructure,
} from "./structure.repository";

export const getFullStructure = async (id: number) => {
  const structure = await findOne(id);
  const allActivites = structure.dnaStructures.flatMap(
    (dnaStructure) => dnaStructure.dna.activites
  );
  const activites = processActivitesForStructure(allActivites);

  const aggregatedEIGs = structure.dnaStructures.flatMap(
    (dnaStructure) => dnaStructure.dna.evenementsIndesirablesGraves
  );

  return {
    ...structure,
    activites,
    evenementsIndesirablesGraves: aggregatedEIGs,
  };
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
