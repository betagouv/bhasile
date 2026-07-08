import { recursivelySerializeDates } from "@/app/utils/date.util";
import { paginateRows } from "@/app/utils/list.util";
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

import { processActivitesForStructure } from "../activites/activite.util";
import {
  buildAdresseAdministrativeComplete,
  getAdressesApiRead,
} from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import { getDnaStructuresApiRead } from "../dna-structures/dna-structure.util";
import { getStructureFinessesApiRead } from "../finesses/finess.util";
import { resolveCurrentVersion } from "../structure-versions/structure-version.util";
import { VERSIONED_FIELD_KEYS } from "./structure.constants";
import {
  StructureDbDetails,
  StructureDbList,
  StructureDbOperateur,
} from "./structure.db.type";
import {
  findAllStructures,
  findOne,
  findOneOperateur,
  findStructureDepartement,
  findStructuresByIds,
  updateOne,
} from "./structure.repository";
import {
  buildStructureHistory,
  buildUpcomingTransformations,
  computeStructureListRow,
  filterStructureRows,
  getAdresseAdministrativeCoordinates,
  getCpomStructuresWithDates,
  getCurrentPlacesAutorisees,
  getCurrentPlacesLogementsSociaux,
  getCurrentPlacesQpv,
  getDatesConvention,
  getDatesPeriodeAutorisation,
  getFermetureHistory,
  getOperateurLabel,
  getTypeBati,
  isBornFromCreation,
  isFinalisationFormValidated,
  isStructureInCpom,
  isStructureInCpomPerYear,
  sortStructureRows,
  StructureListComputedRow,
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
  isClosed?: boolean;
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

const computeAllStructureRows = async (
  now: Date
): Promise<StructureListComputedRow[]> => {
  const structures = await findAllStructures();
  return structures
    .map((structure) =>
      computeStructureListRow(
        structure,
        resolveCurrentVersion(structure.structureVersions, now),
        now
      )
    )
    .filter((row): row is StructureListComputedRow => row !== null);
};

export const getFullStructures = async (
  props: SearchProps,
  user?: SessionUser
): Promise<{
  structures: StructureApiRead[];
  totalStructures: number;
}> => {
  const now = new Date();
  const rows = await computeAllStructureRows(now);

  const filtered = filterStructureRows(rows, props, {
    includeNonVisible: Boolean(props.selection),
  });

  const sorted = sortStructureRows(
    filtered,
    props.column ?? "departementAdministratif",
    props.direction ?? "asc"
  );

  if (props.map) {
    const structures = sorted.map((row) =>
      dbStructureToApiRead(
        {
          id: row.id,
          latitude: row.latitude,
          longitude: row.longitude,
        } as unknown as StructureDbList,
        now,
        true
      )
    );
    return { structures, totalStructures: sorted.length };
  }

  const pageRows = props.selection
    ? sorted
    : paginateRows(sorted, props.page ?? 0);

  const dbStructures = await findStructuresByIds(
    pageRows.map((row) => row.id),
    pageRows.map((row) => row.currentVersionId)
  );
  const dbStructuresById = new Map(
    dbStructures.map((dbStructure) => [dbStructure.id, dbStructure])
  );

  const structures = pageRows
    .map((row) => {
      const dbStructure = dbStructuresById.get(row.id);
      if (!dbStructure) {
        return undefined;
      }
      const currentVersion = dbStructure.structureVersions[0];
      const resolvedStructure = currentVersion
        ? mergeStructureWithVersion(dbStructure, currentVersion)
        : dbStructure;
      const structure = dbStructureToApiRead(
        resolvedStructure,
        now,
        true,
        row.bornFromCreation
      );
      structure.adresses = getReadableAdresses(structure, user);
      if (row.isClosed) {
        structure.history = getFermetureHistory(row);
      }
      return structure;
    })
    .filter(
      (structure): structure is StructureApiRead => structure !== undefined
    );

  return { structures, totalStructures: sorted.length };
};

export const getResolvedStructure = async (
  id: number,
  now: Date = new Date()
): Promise<StructureDbDetails | null> => {
  const dbStructure = await findOne(id);
  if (!dbStructure) {
    return null;
  }
  const currentVersion = resolveCurrentVersion(
    dbStructure.structureVersions,
    now
  );
  return currentVersion
    ? mergeStructureWithVersion(dbStructure, currentVersion)
    : dbStructure;
};

export const getFullStructure = async (
  id: number,
  user?: SessionUser
): Promise<StructureApiRead | null> => {
  const now = new Date();
  const resolvedDbStructure = await getResolvedStructure(id, now);

  if (!resolvedDbStructure) {
    return null;
  }

  const structure = dbStructureToApiRead(
    resolvedDbStructure,
    now,
    false,
    isBornFromCreation(resolvedDbStructure.structureVersions, now)
  );
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
): Promise<StructureDbOperateur> => findOneOperateur(id);

export const getStructureDepartement = async (
  id: number
): Promise<string | null> => {
  const { departementAdministratif } = await findStructureDepartement(
    id,
    new Date()
  );
  return departementAdministratif;
};

export const mergeStructureWithVersion = <T>(
  dbStructure: T,
  version: Record<(typeof VERSIONED_FIELD_KEYS)[number], unknown>
): T => {
  const versionedOverlay = Object.fromEntries(
    VERSIONED_FIELD_KEYS.map((key) => [key, version[key]])
  ) as Partial<T>;
  return { ...dbStructure, ...versionedOverlay };
};

const dbStructureToApiRead = (
  dbStructure: StructureDbDetails | StructureDbList,
  now: Date,
  simple: boolean = false,
  bornFromCreation: boolean = false
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

  const latestTypologie = dbStructure.structureTypologies?.[0];
  const lgbt = (latestTypologie?.lgbt ?? 0) > 0;
  const fvvTeh = (latestTypologie?.fvvTeh ?? 0) > 0;

  const isMultiAntenne = (antennes?.length ?? 0) > 0;
  const isMultiDna =
    (dnaStructures?.length ?? 0) > 1 || (structureFinesses?.length ?? 0) > 1;

  const cpomStructures = getCpomStructuresWithDates(dbStructure, now);

  const history = simple
    ? undefined
    : buildStructureHistory(
        dbStructure as StructureDbDetails,
        cpomStructures ?? [],
        now
      );

  const upcomingTransformations = simple
    ? undefined
    : buildUpcomingTransformations(dbStructure as StructureDbDetails, now);

  return recursivelySerializeDates({
    ...dbStructure,
    debutConvention,
    finConvention,
    debutPeriodeAutorisation,
    finPeriodeAutorisation,
    cpomStructures,
    history,
    upcomingTransformations,
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
    lgbt,
    fvvTeh,
    antennes,
    dnaStructures,
    structureFinesses,
    adresses,
    isFinalised:
      bornFromCreation || isFinalisationFormValidated(dbStructure.forms),
    bornFromCreation: undefined,
    structureVersions: undefined,
  }) as StructureApiRead;
};

export const getBoundsPlacesAutorisees = async (
  now: Date
): Promise<{ min: number; max: number }> => {
  const rows = await computeAllStructureRows(now);
  const places = rows
    .map((row) => row.latestNonNullPlacesAutorisees)
    .filter(
      (placesAutorisees): placesAutorisees is number =>
        placesAutorisees !== null
    );

  if (places.length === 0) {
    return { min: 0, max: 0 };
  }
  return { min: Math.min(...places), max: Math.max(...places) };
};
