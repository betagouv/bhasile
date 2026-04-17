import { Structure } from "@/generated/prisma/client";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";

import { processActivitesForStructure } from "../activites/activite.service";
import {
  findOne,
  getLatestPlacesAutoriseesPerStructure,
  updateOne,
} from "./structure.repository";
import { getAdresseAdministrativeCoordinates } from "./structure.util";

export const updateStructureAgent = async (
  structure: StructureAgentUpdateApiType
): Promise<Structure> => {
  const coordinates = await getAdresseAdministrativeCoordinates(structure);
  return await updateOne(
    {
      ...structure,
      ...coordinates,
    },
    false
  );
};
export const updateStructureOperateur = async (
  structure: StructureAgentUpdateApiType
): Promise<Structure> => {
  const coordinates = await getAdresseAdministrativeCoordinates(structure);
  return await updateOne(
    {
      ...structure,
      ...coordinates,
    },
    true
  );
};

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
