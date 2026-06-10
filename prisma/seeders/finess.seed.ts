import { fakerFR as faker } from "@faker-js/faker";

type StructureForFiness = {
  id: number;
};

export type FinessSeed = {
  code: string;
  description: string;
  structureId: number;
  createdAt: Date;
  updatedAt: Date;
};

export const createFinessList = (
  structures: StructureForFiness[]
): FinessSeed[] => {
  const list: FinessSeed[] = [];
  let counter = 0;

  for (const structure of structures) {
    const nbFiness = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < nbFiness; i++) {
      const code = (100000000 + counter++).toString();
      list.push({
        code,
        structureId: structure.id,
        description: faker.word.noun(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      });
    }
  }

  return list;
};
