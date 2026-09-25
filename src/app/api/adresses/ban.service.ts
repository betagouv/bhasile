import type {
  AdresseLocalisation,
  CommuneCoordinates,
} from "@/types/adresse.type";

import { buildCommuneKey, normalizeLocalisation } from "./adresse.util";
import { searchMunicipality } from "./ban.client";

// La promesse est mémorisée pour qu'un même enregistrement (ou deux simultanés) ne fasse qu'un appel
// par commune. Seules les communes trouvées restent : un échec est retenté au prochain enregistrement.
const communeCoordinatesMemo = new Map<
  string,
  Promise<CommuneCoordinates | null>
>();

const getCommuneCoordinates = async (
  adresse: AdresseLocalisation
): Promise<CommuneCoordinates | null> => {
  const localisation = normalizeLocalisation(adresse);
  if (!localisation) {
    return null;
  }

  const key = buildCommuneKey(localisation);
  const memoized = communeCoordinatesMemo.get(key);
  if (memoized) {
    return memoized;
  }

  const lookup = searchMunicipality(localisation);
  communeCoordinatesMemo.set(key, lookup);
  const coordinates = await lookup;
  if (!coordinates) {
    communeCoordinatesMemo.delete(key);
  }
  return coordinates;
};

export const resolveCommuneCoordinates = <TAdresse extends AdresseLocalisation>(
  adresses: TAdresse[]
): Promise<(TAdresse & { communeCoordinates: CommuneCoordinates | null })[]> =>
  Promise.all(
    adresses.map(async (adresse) => ({
      ...adresse,
      communeCoordinates: await getCommuneCoordinates(adresse),
    }))
  );

export const localiseAdresses = async <
  TEntity extends { adresses?: AdresseLocalisation[] },
>(
  entity: TEntity
): Promise<TEntity> => ({
  ...entity,
  adresses:
    entity.adresses && (await resolveCommuneCoordinates(entity.adresses)),
});

export const localiseStructureVersions = <
  TEntity extends { structureVersion?: { adresses?: AdresseLocalisation[] } },
>(
  entities: TEntity[]
): Promise<TEntity[]> =>
  Promise.all(
    entities.map(async (entity) => ({
      ...entity,
      structureVersion:
        entity.structureVersion &&
        (await localiseAdresses(entity.structureVersion)),
    }))
  );
