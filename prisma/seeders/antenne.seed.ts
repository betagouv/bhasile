import { fakerFR as faker } from "@faker-js/faker";

import { Antenne } from "@/generated/prisma/client";

/**
 * Crée une antenne factice
 */
export const createFakeAntenne = (
  structureCodeBhasile: string
): Omit<Antenne, "id"> => {
  return {
    structureCodeBhasile,
    name: faker.location.city() + " - Antenne",
    adresse: faker.location.streetAddress(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Crée des antennes pour certaines structures
 * @param structureCodesBhasile Array de codes Bhasile de structures
 * @param probability Probabilité qu'une structure ait une antenne (0-1)
 */
export const createFakeAntennes = (
  structureCodesBhasile: string[],
  probability: number = 0.2
): Omit<Antenne, "id">[] => {
  return structureCodesBhasile
    .filter(() => faker.datatype.boolean({ probability }))
    .map((codeBhasile) => createFakeAntenne(codeBhasile));
};

