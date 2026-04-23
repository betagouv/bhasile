import { recursivelySerializeDates } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { Structure } from "@/generated/prisma/client";
import {
  StructureAgentUpdateApiType,
  StructureApiRead,
} from "@/schemas/api/structure.schema";
import { StructureColumn } from "@/types/ListColumn";

import { processActivitesForStructure } from "../activites/activite.service";
import { StructureDbDetails, StructureDbList } from "./structure.db.type";
import {
  countBySearch,
  findBySearch,
  findOne,
  getLatestPlacesAutoriseesPerStructure,
  updateOne,
} from "./structure.repository";
import {
  getAdresseAdministrativeCoordinates,
  getCurrentPlacesAutorisees,
  getCurrentPlacesLogementsSociaux,
  getCurrentPlacesQpv,
  getOperateurLabel,
  getRepartition,
  isStructureInCpom,
  isStructureInCpomPerYear,
} from "./structure.util";

export type SearchProps = {
  search: string | null;
  page: number | null;
  type: string | null;
  bati: string | null;
  placesAutorisees: string | null;
  departements: string | null;
  operateurs: string | null;
  column?: StructureColumn | null;
  direction?: "asc" | "desc" | null;
  map?: boolean;
  selection?: boolean;
};

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

export const getFullStructures = async ({
  search,
  page,
  type,
  bati,
  placesAutorisees,
  departements,
  map,
  column,
  direction,
  operateurs,
  selection,
}: SearchProps): Promise<{
  structures: StructureApiRead[];
  totalStructures: number;
}> => {
  const dbStructures = (await findBySearch({
    search,
    page,
    type,
    bati,
    placesAutorisees,
    departements,
    map,
    column,
    direction,
    operateurs,
    selection,
  })) as StructureDbList[];
  const totalStructures = await countBySearch({
    search,
    page,
    type,
    bati,
    placesAutorisees,
    departements,
    operateurs,
  });

  const structures = dbStructures.map((structure) =>
    dbStructureToApiRead(structure, true)
  );

  return { structures, totalStructures };
};

export const getFullStructure = async (
  id: number
): Promise<StructureApiRead> => {
  const dbStructure = await findOne(id);
  if (!dbStructure) {
    throw new Error(`Structure avec l'identifiant ${id} non trouvée`);
  }

  const structure = dbStructureToApiRead(dbStructure);

  return structure;
};

const dbStructureToApiRead = (
  dbStructure: StructureDbDetails | StructureDbList,
  simple: boolean = false
): StructureApiRead => {
  const allActivites = simple
    ? []
    : (dbStructure as StructureDbDetails).dnaStructures.flatMap(
        (dnaStructure) => dnaStructure.dna.activites
      );
  const activites = processActivitesForStructure(allActivites);

  const aggregatedEIGs = simple
    ? []
    : (dbStructure as StructureDbDetails).dnaStructures.flatMap(
        (dnaStructure) => dnaStructure.dna.evenementsIndesirablesGraves
      );

  return recursivelySerializeDates({
    ...dbStructure,
    activites,
    evenementsIndesirablesGraves: aggregatedEIGs,
    repartition: getRepartition(dbStructure),
    operateurLabel: getOperateurLabel(dbStructure),
    isAutorisee: isStructureAutorisee(dbStructure.type),
    isSubventionnee: isStructureSubventionnee(dbStructure.type),
    currentPlaces: {
      placesAutorisees: getCurrentPlacesAutorisees(dbStructure),
      qpv: getCurrentPlacesQpv(dbStructure),
      logementsSociaux: getCurrentPlacesLogementsSociaux(dbStructure),
    },
    isInCpom: isStructureInCpom(dbStructure),
    isInCpomPerYear: isStructureInCpomPerYear(dbStructure),
  }) as StructureApiRead;
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
