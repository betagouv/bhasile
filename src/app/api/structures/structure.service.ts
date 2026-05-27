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
import { PublicType } from "@/types/structure.type";

import { processActivitesForStructure } from "../activites/activite.service";
import { getAdressesApiRead } from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import { getDnaStructuresApiRead } from "../dna-structures/dna-structure.util";
import { getFinessesApiRead } from "../finesses/finess.util";
import {
  StructureDbDetails,
  StructureDbList,
  StructureDbOperateur,
} from "./structure.db.type";
import {
  countBySearch,
  findBySearch,
  findOne,
  findOneOperateur,
  getLatestPlacesAutoriseesPerStructure,
  updateOne,
} from "./structure.repository";
import {
  getAdresseAdministrativeCoordinates,
  getCpomStructuresWithDates,
  getCurrentPlacesAutorisees,
  getCurrentPlacesLogementsSociaux,
  getCurrentPlacesQpv,
  getDatesConvention,
  getDatesPeriodeAutorisation,
  getOperateurLabel,
  getRepartition,
  isMultiAntenne,
  isMultiDna,
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
): Promise<StructureApiRead | null> => {
  const dbStructure = await findOne(id);

  if (!dbStructure) {
    return null;
  }

  const structure = dbStructureToApiRead(dbStructure);

  return structure;
};

export const getStructureForOperateur = async (
  id: number
): Promise<StructureDbOperateur> => {
  const dbStructure = await findOneOperateur(id);
  if (!dbStructure) {
    throw new Error(`Structure avec l'identifiant ${id} non trouvée`);
  }
  return dbStructure;
};

export const getStructure = async (id: number) => {
  return findOne(id);
};

const dbStructureToApiRead = (
  dbStructure: StructureDbDetails | StructureDbList,
  simple: boolean = false
): StructureApiRead => {
  const [debutConvention, finConvention] = getDatesConvention(dbStructure);
  const [debutPeriodeAutorisation, finPeriodeAutorisation] =
    getDatesPeriodeAutorisation(dbStructure);
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

  const antennes = getAntennesApiRead(
    (dbStructure as StructureDbDetails).antennes
  );
  const dnaStructures = getDnaStructuresApiRead(dbStructure.dnaStructures);
  const finesses = getFinessesApiRead(
    (dbStructure as StructureDbDetails).finesses
  );
  const adresses = getAdressesApiRead(dbStructure.adresses);
  const adresseAdministrativeComplete = [
    dbStructure.adresseAdministrative,
    dbStructure.codePostalAdministratif,
    dbStructure.communeAdministrative,
    dbStructure.departementAdministratif,
  ]
    .filter(Boolean)
    .join(" ");
  const typeBati = getRepartition(dbStructure);

  return recursivelySerializeDates({
    ...dbStructure,
    debutConvention,
    finConvention,
    debutPeriodeAutorisation,
    finPeriodeAutorisation,
    cpomStructures: getCpomStructuresWithDates(dbStructure),
    latitude: dbStructure.latitude?.toString(),
    longitude: dbStructure.longitude?.toString(),
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
    nom: dbStructure.nom ?? "",
    operateur: dbStructure.operateur ?? undefined,
    filiale: dbStructure.filiale ?? undefined,
    date303: dbStructure.date303 ?? undefined,
    public: dbStructure.public
      ? PublicType[dbStructure.public as string as keyof typeof PublicType]
      : undefined,
    adresseAdministrative: dbStructure.adresseAdministrative ?? "",
    codePostalAdministratif: dbStructure.codePostalAdministratif ?? "",
    communeAdministrative: dbStructure.communeAdministrative ?? "",
    departementAdministratif: dbStructure.departementAdministratif ?? "",
    contacts: (dbStructure as StructureDbDetails).contacts ?? [],
    documentsFinanciers:
      (dbStructure as StructureDbDetails).documentsFinanciers ?? [],
    adresseAdministrativeComplete,
    isMultiAntenne: isMultiAntenne((dbStructure as StructureDbDetails).antennes),
    isMultiDna: isMultiDna(
      dbStructure.dnaStructures,
      (dbStructure as StructureDbDetails).finesses
    ),
    typeBati,
    antennes,
    dnaStructures,
    finesses,
    adresses,
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
