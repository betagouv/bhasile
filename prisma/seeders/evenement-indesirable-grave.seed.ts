import { fakerFR as faker } from "@faker-js/faker";

import { EvenementIndesirableGrave } from "@/generated/prisma/client";

const usedNumeroDossiers = new Set<string>();

export const createFakeEvenementIndesirableGrave = ({
  structureId,
  dnaCode,
}: CreateFakeEvenementIndesirableGraveArgs): Omit<
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
    structureId,
    dnaCode,
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

type CreateFakeEvenementIndesirableGraveArgs = {
  structureId: number;
  dnaCode: string;
};
