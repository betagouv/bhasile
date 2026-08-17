import { fakerFR as faker } from "@faker-js/faker";

import { Adresse, Repartition } from "@/generated/prisma/client";

// Écart places à l'adrresse x places autorisées : au-delà de 10 % -> anomalie
const PLACES_GAP_RATIO = 0.2;

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
  codePostal: faker.location.zipCode(),
  commune: faker.location.city(),
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
