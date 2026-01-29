import { fakerFR as faker } from "@faker-js/faker";

import { EvenementIndesirableGrave } from "@/generated/prisma/client";

const usedNumeroDossiers = new Set<string>();

export const createFakeEvenementIndesirableGrave = (): Omit<
  EvenementIndesirableGrave,
  "id" | "structureDnaCode"
> => {
  let numeroDossier = faker.number
    .int({ min: 1000000, max: 10000000 })
    .toString();

  while (usedNumeroDossiers.has(numeroDossier)) {
    numeroDossier = faker.number
      .int({ min: 1000000, max: 10000000 })
      .toString();
  }

  usedNumeroDossiers.add(numeroDossier);

  return {
    declarationDate: faker.date.past({ years: 3 }),
    evenementDate: faker.date.past({ years: 3 }),
    numeroDossier,
    type: faker.helpers.arrayElement([
      "Vol",
      "Comportement violent",
      "Problème RH",
    ]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
