import { cache } from "react";

import { recomputeAnomaliesSafely } from "@/app/api/anomalies/anomalie.service";
import { DomainError } from "@/app/utils/domainError.util";
import { paginateWithTotal } from "@/app/utils/list.util";
import { getNow } from "@/app/utils/now.util";
import {
  getMostRecentMillesime,
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Structure } from "@/generated/prisma/client";
import {
  StructureAgentUpdateApiType,
  StructureApiRead,
} from "@/schemas/api/structure.schema";
import { SessionUser } from "@/types/global";
import { PublicType } from "@/types/structure.type";
import {
  type SearchProps,
  StructureListItem,
  StructureMapPoint,
} from "@/types/structure-list.type";
import { recursivelySerializeForClient } from "@/utils-server/serialization.server.util";

import { processActivitesForStructure } from "../activites/activite.util";
import {
  buildAdresseAdministrativeComplete,
  getAdressesApiRead,
} from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import { getDnaStructuresApiRead } from "../dna-structures/dna-structure.util";
import { getStructureFinessesApiRead } from "../finesses/finess.util";
import { getActualisationFormSlug } from "../forms/form.constants";
import { resolveTypologiesPlacesAutorisees } from "../structure-typologies/structure-typologie.util";
import type { StructureVersionDbDetails } from "../structure-versions/structure-version.db.type";
import {
  resolveCurrentVersion,
  resolveDisplayVersion,
} from "../structure-versions/structure-version.util";
import { VERSIONED_FIELD_KEYS } from "./structure.constants";
import {
  ResolvedStructureDetails,
  StructureDbDetails,
  StructureDbList,
  StructureDbOperateur,
} from "./structure.db.type";
import {
  findAllStructures,
  findOne,
  findOneOperateur,
  findStructureCommunesByIds,
  findStructureDepartement,
  findStructuresByIds,
  findValidatedActualisationForm,
  updateOne,
} from "./structure.repository";
import {
  buildStructureHistory,
  buildStructureListItem,
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
  getReadableAdresses,
  getReadableNotes,
  getTypeBati,
  isStructureClosed,
  isStructureFinalised,
  isStructureInCpom,
  isStructureInCpomPerYear,
  sortStructureRows,
  StructureListComputedRow,
} from "./structure.util";

export const updateStructureAgent = async (
  structure: StructureAgentUpdateApiType
): Promise<Structure> => {
  const coordinates = await getAdresseAdministrativeCoordinates(structure);
  return await updateStructureAndRecomputeAnomalies(
    {
      ...structure,
      ...coordinates,
    },
    false
  );
};

export const updateActualisation = async (
  structure: StructureAgentUpdateApiType,
  year: number
): Promise<Structure> => {
  const alreadyValidated = await findValidatedActualisationForm(
    structure.id,
    getActualisationFormSlug(year)
  );
  if (alreadyValidated) {
    throw new DomainError(
      `Structure ${structure.id} déjà actualisée pour ${year}`,
      409
    );
  }

  return updateStructureAndRecomputeAnomalies(structure, false, {
    skipActesOrphanDelete: true,
  });
};
export const updateStructureOperateur = async (
  structure: StructureAgentUpdateApiType
): Promise<Structure> => {
  const coordinates = await getAdresseAdministrativeCoordinates(structure);
  return await updateStructureAndRecomputeAnomalies(
    {
      ...structure,
      ...coordinates,
    },
    true
  );
};

// Le recalcul suit le commit et n'est jamais dans la transaction d'écriture.
const updateStructureAndRecomputeAnomalies = async (
  ...args: Parameters<typeof updateOne>
): Promise<Structure> => {
  const updated = await updateOne(...args);
  await recomputeAnomaliesSafely(updated.id);

  return updated;
};

const getRequestNow = cache((): Date => getNow());

const computeAllStructureRows = cache(
  async (): Promise<StructureListComputedRow[]> => {
    const now = getRequestNow();
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
  }
);

// Mémoïsé sur la référence de props : la page construit une seule query et la
// passe à chaque Suspense, donc compteur, tableau et carte partagent le cache
const getSortedStructureRows = cache(
  async (props: SearchProps): Promise<StructureListComputedRow[]> => {
    const rows = await computeAllStructureRows();

    const filtered = filterStructureRows(rows, props, {
      includeNonVisible: Boolean(props.selection),
    });

    return sortStructureRows(
      filtered,
      props.column ?? "departementAdministratif",
      props.direction ?? "asc"
    );
  }
);

export const getStructuresTotal = async (props: SearchProps): Promise<number> =>
  (await getSortedStructureRows(props)).length;

export const getStructureMapPoints = cache(
  async (props: SearchProps): Promise<StructureMapPoint[]> => {
    const sorted = await getSortedStructureRows(props);

    return sorted.flatMap((row) =>
      row.latitude === null || row.longitude === null
        ? []
        : [
            {
              id: row.id,
              latitude: row.latitude.toString(),
              longitude: row.longitude.toString(),
            },
          ]
    );
  }
);

export const getStructureListItems = async (
  props: SearchProps
): Promise<{ structures: StructureListItem[]; totalStructures: number }> => {
  const sorted = await getSortedStructureRows(props);
  const { total: totalStructures, rows: pageRows } = paginateWithTotal(
    sorted,
    props.page,
    DEFAULT_PAGE_SIZE
  );

  const versions = await findStructureCommunesByIds(
    pageRows.map((row) => row.currentVersionId)
  );
  const adressesByStructureId = new Map(
    versions.map((version) => [version.structureId, version.adresses])
  );

  return {
    structures: pageRows.map((row) =>
      buildStructureListItem(row, adressesByStructureId.get(row.id) ?? [])
    ),
    totalStructures,
  };
};

export const getFullStructures = async (
  props: SearchProps,
  user?: SessionUser
): Promise<{
  structures: StructureApiRead[];
  totalStructures: number;
}> => {
  const now = getRequestNow();
  const sorted = await getSortedStructureRows(props);

  const { total: totalStructures, rows: pageRows } = props.selection
    ? { total: sorted.length, rows: sorted }
    : paginateWithTotal(sorted, props.page, DEFAULT_PAGE_SIZE);

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
      const structure = dbStructureToApiRead(resolvedStructure, now, {
        isFinalised: row.isFinalised,
        simple: true,
      });
      structure.currentPlaces.placesAutorisees = row.placesAutorisees ?? 0;
      structure.adresses = getReadableAdresses(structure, user);
      structure.notes = null;
      if (row.isClosed) {
        structure.history = getFermetureHistory(row);
      }
      return structure;
    })
    .filter(
      (structure): structure is StructureApiRead => structure !== undefined
    );

  return { structures, totalStructures };
};

export const getResolvedStructure = async (
  id: number,
  now: Date = getNow()
): Promise<ResolvedStructureDetails | null> => {
  const dbStructure = await findOne(id);
  if (!dbStructure) {
    return null;
  }
  const displayVersion = resolveDisplayVersion(
    dbStructure.structureVersions,
    now
  );
  if (!displayVersion) {
    throw new Error(`Aucune version affichable pour la structure ${id}`);
  }
  return mergeStructureWithVersion(dbStructure, displayVersion);
};

export const getFullStructure = async (
  id: number,
  user?: SessionUser
): Promise<StructureApiRead | null> => {
  const now = getNow();
  const resolvedDbStructure = await getResolvedStructure(id, now);

  if (!resolvedDbStructure) {
    return null;
  }

  const structure = dbStructureToApiRead(resolvedDbStructure, now, {
    isFinalised: isStructureFinalised(resolvedDbStructure, now),
  });
  structure.adresses = getReadableAdresses(structure, user);
  structure.notes = getReadableNotes(structure, user);

  return structure;
};

export const getStructureForOperateur = async (
  id: number
): Promise<StructureDbOperateur> => findOneOperateur(id);

export const getStructureDepartement = async (id: number): Promise<string> => {
  const { departementAdministratif } = await findStructureDepartement(id);
  return departementAdministratif;
};

export const mergeStructureWithVersion = <T>(
  dbStructure: T,
  version: Record<(typeof VERSIONED_FIELD_KEYS)[number], unknown>
): T &
  Pick<StructureVersionDbDetails, (typeof VERSIONED_FIELD_KEYS)[number]> => {
  const versionedOverlay = Object.fromEntries(
    VERSIONED_FIELD_KEYS.map((key) => [key, version[key]])
  ) as Pick<StructureVersionDbDetails, (typeof VERSIONED_FIELD_KEYS)[number]>;
  return { ...dbStructure, ...versionedOverlay };
};

const dbStructureToApiRead = (
  dbStructure: (StructureDbDetails | StructureDbList) &
    Partial<
      Pick<StructureVersionDbDetails, (typeof VERSIONED_FIELD_KEYS)[number]>
    >,
  now: Date,
  { isFinalised, simple = false }: { isFinalised: boolean; simple?: boolean }
): StructureApiRead => {
  const [debutConvention, finConvention] = getDatesConvention(dbStructure);
  const [debutPeriodeAutorisation, finPeriodeAutorisation] =
    getDatesPeriodeAutorisation(dbStructure);
  const allActivites = simple
    ? []
    : (dbStructure as ResolvedStructureDetails).dnaStructures.flatMap(
        (dnaStructure) => dnaStructure.dna.activites
      );
  const activites = processActivitesForStructure(allActivites);

  const aggregatedEIGs = simple
    ? []
    : (dbStructure as ResolvedStructureDetails).dnaStructures.flatMap(
        (dnaStructure) => dnaStructure.dna.evenementsIndesirablesGraves
      );

  const antennes = getAntennesApiRead(
    (dbStructure as ResolvedStructureDetails).antennes
  );
  const dnaStructures = getDnaStructuresApiRead(
    (dbStructure as ResolvedStructureDetails).dnaStructures
  );
  const structureFinesses = getStructureFinessesApiRead(
    (dbStructure as ResolvedStructureDetails).structureFinesses
  );
  const adresses = getAdressesApiRead(
    (dbStructure as ResolvedStructureDetails).adresses
  );
  const adresseAdministrativeComplete =
    buildAdresseAdministrativeComplete(dbStructure);
  const typeBati = getTypeBati(dbStructure);

  const latestTypologie = getMostRecentMillesime(
    dbStructure.structureTypologies,
    { currentYear: now.getFullYear() }
  );
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

  const structureTypologies = simple
    ? (dbStructure.structureTypologies ?? [])
    : resolveTypologiesPlacesAutorisees(
        dbStructure.structureTypologies ?? [],
        (dbStructure as StructureDbDetails).structureVersions ?? [],
        now
      );

  const currentVersion = simple
    ? undefined
    : resolveCurrentVersion(
        (dbStructure as StructureDbDetails).structureVersions ?? [],
        now
      );

  const isCurrentVersionFromTransformation =
    currentVersion?.structureVersionTransformationId != null;

  return recursivelySerializeForClient({
    ...dbStructure,
    structureTypologies,
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
    // Total autorisé porté par la version, à ne pas confondre avec
    // currentPlaces.placesAutorisees qui somme les adresses.
    placesAutorisees: currentVersion?.placesAutorisees ?? null,
    anomalies: "anomalies" in dbStructure ? dbStructure.anomalies : [],
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
    contacts: (dbStructure as ResolvedStructureDetails).contacts ?? [],
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
    isFinalised,
    isClosed: isStructureClosed(dbStructure, now),
    isCurrentVersionFromTransformation,
    structureVersions: undefined,
  }) as StructureApiRead;
};

export const getBoundsPlacesAutorisees = async (): Promise<{
  min: number;
  max: number;
}> => {
  const rows = await computeAllStructureRows();
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
