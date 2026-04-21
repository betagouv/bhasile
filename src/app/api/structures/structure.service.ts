import { Structure } from "@/generated/prisma/client";
import {
  StructureAgentUpdateApiType,
  StructureApiRead,
} from "@/schemas/api/structure.schema";

import { processActivitesForStructure } from "../activites/activite.service";
import {
  findOne,
  getLatestPlacesAutoriseesPerStructure,
  updateOne,
} from "./structure.repository";
import {
  dbStructureToApiWrite,
  getAdresseAdministrativeCoordinates,
  getCurrentPlacesAutorisees,
  getCurrentPlacesLogementsSociaux,
  getCurrentPlacesQpv,
  getRepartition,
  isStructureInCpom,
  wasStructureInCpom,
} from "./structure.util";

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

export const getFullStructure = async (id: number): Promise<StructureApiRead> => {
  const dbStructure = await findOne(id);
  const structure = dbStructureToApiWrite(dbStructure);
  const currentYear = new Date().getFullYear();
  const creationYear = new Date(
    structure.creationDate ?? new Date().toISOString()
  ).getFullYear();
  const yearsSinceCreation = Array.from(
    { length: currentYear - creationYear + 1 },
    (_, index) => creationYear + index
  );
  const allActivites = dbStructure.dnaStructures.flatMap(
    (dnaStructure) => dnaStructure.dna.activites
  );
  const activites = processActivitesForStructure(allActivites);

  const aggregatedEIGs = dbStructure.dnaStructures.flatMap(
    (dnaStructure) => dnaStructure.dna.evenementsIndesirablesGraves
  );

  return {
    ...structure,
    activites,
    evenementsIndesirablesGraves: aggregatedEIGs,
    repartition: getRepartition(structure),
    currentPlaces: {
      placesAutorisees: getCurrentPlacesAutorisees(structure),
      qpv: getCurrentPlacesQpv(structure),
      logementsSociaux: getCurrentPlacesLogementsSociaux(structure),
    },
    isInCpom: isStructureInCpom(structure),
    wasInCpom: wasStructureInCpom(structure, yearsSinceCreation),
  } as unknown as StructureApiRead;
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
