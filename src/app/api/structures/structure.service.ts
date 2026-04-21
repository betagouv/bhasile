import { serializeDates } from "@/app/utils/date.util";
import { Structure } from "@/generated/prisma/client";
import { ActiviteApiType } from "@/schemas/api/activite.schema";
import { EvenementIndesirableGraveApiType } from "@/schemas/api/evenement-indesirable-grave.schema";
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
  isStructureInCpomPerYear,
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

export const getFullStructure = async (
  id: number
): Promise<StructureApiRead> => {
  const dbStructure = await findOne(id);
  const structure = dbStructureToApiWrite(dbStructure);
  const allActivites = dbStructure.dnaStructures.flatMap(
    (dnaStructure) => dnaStructure.dna.activites
  );
  const activites = serializeDates(
    processActivitesForStructure(allActivites)
  ) as ActiviteApiType[];

  const aggregatedEIGs = serializeDates(
    dbStructure.dnaStructures.flatMap(
      (dnaStructure) => dnaStructure.dna.evenementsIndesirablesGraves
    )
  ) as EvenementIndesirableGraveApiType[];

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
    isInCpomPerYear: isStructureInCpomPerYear(structure),
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
