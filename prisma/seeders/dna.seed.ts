import { fakerFR as faker } from "@faker-js/faker";

import { Dna } from "@/generated/prisma/client";

/**
 * Crée un code DNA factice
 */
export const createFakeDna = (): Omit<Dna, "id"> => {
  const dnaTypes = ["C", "H", "M"]; // CADA, HUDA, MIXTE
  const type = faker.helpers.arrayElement(dnaTypes);
  const numero = faker.number.int({ min: 1, max: 999 }).toString().padStart(3, "0");
  const code = `${type}-${numero}`;

  return {
    code,
    granularity: faker.helpers.maybe(
      () => faker.helpers.arrayElement(["STRUCTURE", "ADRESSE"]),
      { probability: 0.5 }
    ) ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Crée plusieurs codes DNA
 */
export const createFakeDnaList = (count: number = 100): Omit<Dna, "id">[] => {
  const codes = new Set<string>();
  const dnaList: Omit<Dna, "id">[] = [];

  while (dnaList.length < count) {
    const dna = createFakeDna();
    if (!codes.has(dna.code)) {
      codes.add(dna.code);
      dnaList.push(dna);
    }
  }

  return dnaList;
};

