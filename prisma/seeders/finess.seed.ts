import { fakerFR as faker } from "@faker-js/faker";

type VersionForFiness = {
  structureVersionId: number;
};

export type FinessSeed = {
  code: string;
  description: string;
  structureVersionId: number;
  createdAt: Date;
  updatedAt: Date;
};

export const createFinessList = (
  versions: VersionForFiness[]
): FinessSeed[] => {
  const list: FinessSeed[] = [];
  let counter = 0;

  for (const version of versions) {
    const nbFiness = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < nbFiness; i++) {
      const code = (100000000 + counter++).toString();
      list.push({
        code,
        structureVersionId: version.structureVersionId,
        description: faker.word.noun(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      });
    }
  }

  return list;
};
