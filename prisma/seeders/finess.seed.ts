import { fakerFR as faker } from "@faker-js/faker";

import { Finess } from "@/generated/prisma/client";

type StructureForFiness = {
  id: number;
};

export const createFinessList = (
  structures: StructureForFiness[]
): Omit<Finess, "id">[] => {
  const list: Omit<Finess, "id">[] = [];
  let counter = 0;

  for (const structure of structures) {
    const nbFiness = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < nbFiness; i++) {
      const code = (100000000 + counter++).toString();
      list.push({
        code,
        structureId: structure.id,
        granularity: faker.word.noun(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      });
    }
  }

  return list;
};
