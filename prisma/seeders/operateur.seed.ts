import { fakerFR as faker } from "@faker-js/faker";

import { Operateur } from "@/generated/prisma/client";

export const createFakeOperateur = (index: number): Omit<Operateur, "id"> => {
  return {
    name: `Opérateur ${index + 1}`,
    directionGenerale: faker.lorem.words(2),
    siret: faker.number.int(10000000000000).toString(),
    siegeSocial: faker.lorem.words(2),
    parentId: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};

export const createFakeFiliale = (
  parentOperateurId: number,
  parentOperateurName: string,
  index: number
): Omit<Operateur, "id"> => {
  const createdAt = faker.date.past();
  return {
    name: `${parentOperateurName} - Filiale ${index + 1}`,
    directionGenerale: faker.lorem.words(2),
    siret: faker.number.int(10000000000000).toString(),
    siegeSocial: faker.lorem.words(2),
    parentId: parentOperateurId,
    createdAt,
    updatedAt: createdAt,
  };
};
