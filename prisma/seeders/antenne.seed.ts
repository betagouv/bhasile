import { fakerFR as faker } from "@faker-js/faker";

import { Antenne } from "@/generated/prisma/client";

type StructureForAntenne = {
  id: number;
};

export const createAntenneList = (
  structures: StructureForAntenne[]
): Omit<Antenne, "id">[] => {
  const antenneList: Omit<Antenne, "id">[] = [];

  for (const structure of structures) {
    const nbAntennes = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < nbAntennes; i++) {
      antenneList.push({
        structureId: structure.id,
        name: faker.lorem.words(2),
        adresse: faker.location.streetAddress(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      });
    }
  }

  return antenneList;
};
