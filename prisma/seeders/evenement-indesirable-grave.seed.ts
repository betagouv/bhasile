import { fakerFR as faker } from "@faker-js/faker";

import { EvenementIndesirableGrave } from "@/generated/prisma/client";

export const createFakeEvenementIndesirableGrave = (): Omit<
  EvenementIndesirableGrave,
  "id" | "structureDnaCode"
> => {
  return {
    declarationDate: faker.date.past(),
    evenementDate: faker.date.past(),
    numeroDossier: faker.number.int({ min: 1000000, max: 10000000 }).toString(),
    type: faker.helpers.arrayElement([
      "Vol",
      "Comportement violent",
      "Problème RH",
    ]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
