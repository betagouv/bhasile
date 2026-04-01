import { fakerFR as faker } from "@faker-js/faker";

import { EvenementIndesirableGrave } from "@/generated/prisma/client";

const usedNumeroDossiers = new Set<string>();

export type StructureWithDnasForSeed = {
  id: number;
  dnaStructures: { dna: { code: string } | null }[];
};

export const createFakeEvenementIndesirableGrave = ({
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
  structuresWithDna: StructureWithDnasForSeed[]
): Omit<EvenementIndesirableGrave, "id" | "structureDnaCode">[] => {
  return structuresWithDna.flatMap((structure) => {
    if (!faker.helpers.maybe(() => true, { probability: 0.5 })) {
      return [];
    }

    return structure.dnaStructures.flatMap((dnaStructure) => {
      const dnaCode = dnaStructure?.dna?.code;
      if (!dnaCode) {
        return [];
      }

      return Array.from({ length: faker.number.int({ min: 0, max: 15 }) }, () =>
        createFakeEvenementIndesirableGrave({ dnaCode })
      );
    });
  });
};
