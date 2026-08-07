import { fakerFR as faker } from "@faker-js/faker";

import { EvenementIndesirableGrave } from "@/generated/prisma/client";

const usedNumeroDossiers = new Set<string>();

export type VersionDnaCodes = {
  dnaCodes: string[];
};

const createFakeEvenementIndesirableGrave = ({
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
  dnaCode: string;
};

export const createEvenementsIndesirablesGraves = (
  versions: VersionDnaCodes[]
): Omit<EvenementIndesirableGrave, "id" | "structureDnaCode">[] => {
  return versions.flatMap((version) => {
    if (!faker.helpers.maybe(() => true, { probability: 0.5 })) {
      return [];
    }

    return version.dnaCodes.flatMap((dnaCode) =>
      Array.from({ length: faker.number.int({ min: 0, max: 15 }) }, () =>
        createFakeEvenementIndesirableGrave({ dnaCode })
      )
    );
  });
};
