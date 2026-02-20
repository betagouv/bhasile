import { fakerFR as faker } from "@faker-js/faker";

import {
  Adresse,
  AdresseTypologie,
  Repartition,
} from "@/generated/prisma/client";

import { createFakeAdresseTypologie } from "./adresse-typologie.seed";

export type AdresseWithTypologies = Adresse & {
  adresseTypologies: Omit<AdresseTypologie, "id" | "adresseId">[];
};

export const createFakeAdresses = ({
  placesAutorisees,
}: CreateFakeAdressesArgs): Omit<
  AdresseWithTypologies,
  "id" | "structureDnaCode"
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
  AdresseWithTypologies,
  "id" | "structureDnaCode"
> => {
  return {
    adresse: faker.location.streetAddress(),
    codePostal: faker.location.zipCode(),
    commune: faker.location.city(),
    repartition,
    adresseTypologies: [
      createFakeAdresseTypologie({ year: 2025, placesAutorisees }),
      createFakeAdresseTypologie({ year: 2024, placesAutorisees }),
      createFakeAdresseTypologie({ year: 2023, placesAutorisees }),
    ],
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};

type CreateFakeAdressesArgs = {
  placesAutorisees: number;
};

type CreateFakeAdresseArgs = {
  placesAutorisees: number;
  repartition: Repartition;
};
