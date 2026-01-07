import { fakerFR as faker } from "@faker-js/faker";

import { AdresseTypologie } from "@/generated/prisma/client";

export const createFakeAdresseTypologie = ({
  year,
  placesAutorisees,
}: CreateFakeAdresseTypologieOptions): Omit<
  AdresseTypologie,
  "id" | "adresseId"
> => {
  return {
    year,
    placesAutorisees,
    qpv: faker.number.int({ min: 0, max: placesAutorisees / 5 }),
    logementSocial: faker.number.int({ min: 0, max: placesAutorisees / 5 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};

type CreateFakeAdresseTypologieOptions = {
  placesAutorisees: number;
  year: number;
};
