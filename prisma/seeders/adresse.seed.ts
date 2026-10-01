import { fakerFR as faker } from "@faker-js/faker";

import { Adresse, Repartition } from "@/generated/prisma/client";

// Écart places à l'adrresse x places autorisées : au-delà de 10 % -> anomalie
const PLACES_GAP_RATIO = 0.2;
// Quelques adresses non localisées alimentent l'anomalie ADRESSE_NON_LOCALISEE
const NON_LOCALISEE_RATIO = 0.05;

export const STRUCTURE_ZONE = {
  minLatitude: 43.550851,
  maxLatitude: 49.131627,
  minLongitude: -0.851371,
  maxLongitude: 5.843377,
};

const FAKE_COMMUNES_COUNT = 60;

type FakeCommune = Pick<
  Adresse,
  | "codePostal"
  | "commune"
  | "communeGeocodee"
  | "communeLatitude"
  | "communeLongitude"
>;

let fakeCommunes: FakeCommune[] | undefined;

const getFakeCommunes = (): FakeCommune[] =>
  (fakeCommunes ??= Array.from({ length: FAKE_COMMUNES_COUNT }, () => {
    const commune = faker.location.city();
    return {
      codePostal: faker.location.zipCode(),
      commune,
      communeGeocodee: commune,
      communeLatitude: faker.location.latitude({
        min: STRUCTURE_ZONE.minLatitude,
        max: STRUCTURE_ZONE.maxLatitude,
      }),
      communeLongitude: faker.location.longitude({
        min: STRUCTURE_ZONE.minLongitude,
        max: STRUCTURE_ZONE.maxLongitude,
      }),
    };
  }));

export const createFakeAdresses = ({
  placesAutorisees,
}: CreateFakeAdressesArgs): Omit<
  Adresse,
  "id" | "structureDnaCode" | "structureId" | "structureVersionTransformationId"
>[] => {
  const totalPlaces = Math.max(
    1,
    Math.round(
      placesAutorisees *
        faker.number.float({
          min: 1 - PLACES_GAP_RATIO,
          max: 1 + PLACES_GAP_RATIO,
        })
    )
  );
  const count = Math.min(faker.number.int({ min: 1, max: 10 }), totalPlaces);
  const hasCollectif = faker.datatype.boolean();
  const collectifIndex = hasCollectif
    ? faker.number.int({ min: 0, max: count - 1 })
    : -1;
  const placesPerAdresse = splitPlaces(totalPlaces, count);

  return Array.from({ length: count }, (_, index) =>
    createFakeAdresse({
      placesAutorisees: placesPerAdresse[index],
      repartition:
        index === collectifIndex ? Repartition.COLLECTIF : Repartition.DIFFUS,
    })
  );
};

// Répartit le total entre les adresses.
const splitPlaces = (total: number, count: number): number[] => {
  const places: number[] = [];
  let left = total;

  for (let index = 0; index < count - 1; index++) {
    const reservedForNext = count - index - 1;
    const share = faker.number.int({
      min: 1,
      max: Math.max(1, left - reservedForNext),
    });
    places.push(share);
    left -= share;
  }
  places.push(left);

  return places;
};

const createFakeAdresse = ({
  placesAutorisees,
  repartition,
}: CreateFakeAdresseArgs): Omit<
  Adresse,
  "id" | "structureDnaCode" | "structureId" | "structureVersionTransformationId"
> => ({
  adresse: faker.location.streetAddress(),
  ...(faker.datatype.boolean({ probability: NON_LOCALISEE_RATIO })
    ? {
        codePostal: faker.location.zipCode(),
        commune: faker.location.city(),
        communeGeocodee: null,
        communeLatitude: null,
        communeLongitude: null,
      }
    : faker.helpers.arrayElement(getFakeCommunes())),
  repartition,
  placesAutorisees,
  isQpv: faker.datatype.boolean(),
  isLogementSocial: faker.datatype.boolean(),
  structureVersionId: null,
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
});

type CreateFakeAdressesArgs = {
  placesAutorisees: number;
};

type CreateFakeAdresseArgs = {
  placesAutorisees: number;
  repartition: Repartition;
};
