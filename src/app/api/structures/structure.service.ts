import { recursivelySerializeDates } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { Structure } from "@/generated/prisma/client";
import { canUpdateStructure } from "@/lib/casl/abilities";
import {
  StructureAgentUpdateApiType,
  StructureApiRead,
} from "@/schemas/api/structure.schema";
import { SessionUser } from "@/types/global";
import { StructureColumn } from "@/types/ListColumn";
import { PublicType } from "@/types/structure.type";

import { processActivitesForStructure } from "../activites/activite.service";
import {
  buildAdresseAdministrativeComplete,
  getAdressesApiRead,
} from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import { getDnaStructuresApiRead } from "../dna-structures/dna-structure.util";
import { getStructureFinessesApiRead } from "../finesses/finess.util";
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
  getTypeBati,
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
  finalised?: boolean;
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

export const getFullStructures = async (
  {
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
    finalised,
  }: SearchProps,
  user?: SessionUser
): Promise<{
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
    finalised,
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

  const structures = dbStructures.map((dbStructure) => {
    const structure = dbStructureToApiRead(dbStructure, true);
    structure.adresses = getReadableAdresses(structure, user);
    return structure;
  });

  return { structures, totalStructures };
};

export const getFullStructure = async (
  id: number,
  user?: SessionUser
): Promise<StructureApiRead | null> => {
  const dbStructure = await findOne(id);

  if (!dbStructure) {
    return null;
  }

  const structure = dbStructureToApiRead(dbStructure);
  structure.adresses = getReadableAdresses(structure, user);

  return structure;
};

const getReadableAdresses = (
  structure: StructureApiRead,
  user?: SessionUser
): StructureApiRead["adresses"] => {
  if (user && canUpdateStructure(user, structure)) {
    return structure.adresses;
  }

  return structure.adresses?.map((adresse) => ({
    ...adresse,
    adresse: "",
    adresseComplete: [adresse.codePostal, adresse.commune]
      .filter(Boolean)
      .join(" ")
      .trim(),
  }));
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
  const structureFinesses = getStructureFinessesApiRead(
    (dbStructure as StructureDbDetails).structureFinesses
  );
  const adresses = getAdressesApiRead(dbStructure.adresses);
  const adresseAdministrativeComplete =
    buildAdresseAdministrativeComplete(dbStructure);
  const typeBati = getTypeBati(dbStructure);

  const isMultiAntenne = (antennes?.length ?? 0) > 0;
  const isMultiDna =
    (dnaStructures?.length ?? 0) > 1 || (structureFinesses?.length ?? 0) > 1;

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
    isMultiAntenne,
    isMultiDna,
    typeBati,
    antennes,
    dnaStructures,
    structureFinesses,
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
