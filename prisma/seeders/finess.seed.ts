import { fakerFR as faker } from "@faker-js/faker";

import { Finess } from "@/generated/prisma/client";

/**
 * Crée des codes FINESS factices
 */
export const createFakeFiness = (): Omit<Finess, "id"> => {
  return {
    code: faker.number.int({ min: 100000000, max: 999999999 }).toString(),
    granularity: faker.helpers.maybe(() => faker.helpers.arrayElement(["ET", "EJ"]), {
      probability: 0.3,
    }) ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Crée plusieurs codes FINESS
 */
export const createFakeFinessList = (count: number = 50): Omit<Finess, "id">[] => {
  const codes = new Set<string>();
  const finessList: Omit<Finess, "id">[] = [];

  while (finessList.length < count) {
    const finess = createFakeFiness();
    if (!codes.has(finess.code)) {
      codes.add(finess.code);
      finessList.push(finess);
    }
  }

  return finessList;
};

