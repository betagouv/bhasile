import type {
  AdresseLocalisation,
  CommuneCoordinates,
} from "@/types/adresse.type";

import {
  buildCommuneKey,
  NormalizedLocalisation,
  normalizeLocalisation,
} from "./adresse.util";
import { searchMunicipality } from "./ban.client";

// La BAN limite à 50 requêtes/s par IP, partagée avec l'application : on en garde la moitié.
const BAN_BATCH_SIZE = 25;
const BAN_BATCH_PAUSE_MS = 1_000;

type CoordinatesByCommune = Map<string, CommuneCoordinates | null>;

const findCommuneKey = (adresse: AdresseLocalisation): string | null => {
  const localisation = normalizeLocalisation(adresse);
  return localisation && buildCommuneKey(localisation);
};

const fetchCoordinatesByCommune = async (
  adresses: AdresseLocalisation[]
): Promise<CoordinatesByCommune> => {
  const localisations = new Map<string, NormalizedLocalisation>();
  for (const adresse of adresses) {
    const localisation = normalizeLocalisation(adresse);
    if (localisation) {
      localisations.set(buildCommuneKey(localisation), localisation);
    }
  }

  const entries = [...localisations];
  const coordinatesByCommune: CoordinatesByCommune = new Map();
  for (let start = 0; start < entries.length; start += BAN_BATCH_SIZE) {
    if (start > 0) {
      await new Promise((resolve) => setTimeout(resolve, BAN_BATCH_PAUSE_MS));
    }
    const batch = entries.slice(start, start + BAN_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(([, localisation]) => searchMunicipality(localisation))
    );
    batch.forEach(([key], index) =>
      coordinatesByCommune.set(key, results[index])
    );
  }
  return coordinatesByCommune;
};

const withCommuneCoordinates = <TAdresse extends AdresseLocalisation>(
  adresse: TAdresse,
  coordinatesByCommune: CoordinatesByCommune
): TAdresse & { communeCoordinates: CommuneCoordinates | null } => {
  const key = findCommuneKey(adresse);
  return {
    ...adresse,
    communeCoordinates: key ? (coordinatesByCommune.get(key) ?? null) : null,
  };
};

export const resolveCommuneCoordinates = async <
  TAdresse extends AdresseLocalisation,
>(
  adresses: TAdresse[]
): Promise<
  (TAdresse & { communeCoordinates: CommuneCoordinates | null })[]
> => {
  const coordinatesByCommune = await fetchCoordinatesByCommune(adresses);
  return adresses.map((adresse) =>
    withCommuneCoordinates(adresse, coordinatesByCommune)
  );
};

export const localiseAdresses = async <
  TEntity extends { adresses?: AdresseLocalisation[] },
>(
  entity: TEntity
): Promise<TEntity> => ({
  ...entity,
  adresses:
    entity.adresses && (await resolveCommuneCoordinates(entity.adresses)),
});

export const localiseStructureVersions = async <
  TEntity extends { structureVersion?: { adresses?: AdresseLocalisation[] } },
>(
  entities: TEntity[]
): Promise<TEntity[]> => {
  const coordinatesByCommune = await fetchCoordinatesByCommune(
    entities.flatMap((entity) => entity.structureVersion?.adresses ?? [])
  );
  return entities.map((entity) => ({
    ...entity,
    structureVersion: entity.structureVersion && {
      ...entity.structureVersion,
      adresses: entity.structureVersion.adresses?.map((adresse) =>
        withCommuneCoordinates(adresse, coordinatesByCommune)
      ),
    },
  }));
};
