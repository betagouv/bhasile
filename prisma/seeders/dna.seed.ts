import { fakerFR as faker } from "@faker-js/faker";

import { Dna } from "@/generated/prisma/client";

const DNA_TYPES = ["C", "H", "K", "R"] as const;

export const createDnaList = (count: number): Omit<Dna, "id">[] => {
  const dnaList: Omit<Dna, "id">[] = [];

  for (let i = 0; i < count; i++) {
    const type = DNA_TYPES[i % DNA_TYPES.length];
    const numero = Math.floor(i / DNA_TYPES.length) + 1;
    const code = `${type}-${String(numero).padStart(3, "0")}`;

    dnaList.push({
      code,
      description: faker.lorem.words(2),
      activeInOfiiFileSince:
        faker.helpers.maybe(() => faker.date.past({ years: 4 }), {
          probability: 0.1,
        }) ?? null,
      inactiveInOfiiFileSince:
        faker.helpers.maybe(() => faker.date.past({ years: 2 }), {
          probability: 0.05,
        }) ?? null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    });
  }

  return dnaList;
};

export const createDnaStructures = ({
  dnaList,
  dnaByCode,
  perStructureCounts,
}: CreateDnaStructuresOptions) => {
  const dnaStructures: Array<{
    dnaId: number;
    structureId: number;
    startDate: Date | null;
    endDate: Date | null;
  }> = [];

  let cursor = 0;
  for (const { structureId, count } of perStructureCounts) {
    for (let i = 0; i < count; i++) {
      const dna = dnaList[cursor++];
      const dnaId = dnaByCode.get(dna.code);
      if (!dnaId) {
        continue;
      }

      dnaStructures.push({
        dnaId,
        structureId,
        startDate:
          faker.helpers.maybe(() => faker.date.past({ years: 2 }), {
            probability: 0.1,
          }) ?? null,
        endDate:
          faker.helpers.maybe(() => faker.date.past({ years: 2 }), {
            probability: 0.1,
          }) ?? null,
      });
    }
  }
  return dnaStructures;
};

type CreateDnaStructuresOptions = {
  dnaList: Omit<Dna, "id">[];
  dnaByCode: Map<string, number>;
  perStructureCounts: { structureId: number; count: number }[];
};
