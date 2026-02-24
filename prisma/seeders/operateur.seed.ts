import { fakerFR as faker } from "@faker-js/faker";

import { Operateur } from "@/generated/prisma/client";

export const createFakeOperateur = (index: number): Omit<Operateur, "id"> => {
  const operateurs = Array.from({ length: 5 }, () => `Opérateur ${index + 1}`);

  return {
    name: faker.helpers.arrayElement(operateurs),
    directionGenerale: faker.lorem.words(2),
    siret: faker.number.int(10000000000000).toString(),
    siegeSocial: faker.lorem.words(2),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
