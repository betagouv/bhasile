import { fakerFR as faker } from "@faker-js/faker";

import { Adresse, Repartition } from "@/generated/prisma/client";

export const createFakeAdresses = ({
  placesAutorisees,
}: CreateFakeAdressesArgs): Omit<
  Adresse,
  "id" | "structureDnaCode" | "structureId" | "structureVersionTransformationId"
>[] => {
  const count = faker.number.int({ min: 1, max: 10 });
  const hasCollectif = faker.datatype.boolean();
  const collectifIndex = hasCollectif
    ? faker.number.int({ min: 0, max: count - 1 })
    : -1;

  return Array.from({ length: count }, (_, index) =>
    createFakeAdresse({
      placesAutorisees,
      repartition:
        index === collectifIndex ? Repartition.COLLECTIF : Repartition.DIFFUS,
    })
  );
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
