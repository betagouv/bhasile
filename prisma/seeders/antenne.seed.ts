import { fakerFR as faker } from "@faker-js/faker";

import { Antenne } from "@/generated/prisma/client";

type StructureWithCodeBhasile = {
  codeBhasile: string | null;
};

/**
 * Génère entre 1 et 3 antennes par structure ayant un codeBhasile.
 */
export const createAntenneList = (
  structures: StructureWithCodeBhasile[]
): Omit<Antenne, "id">[] => {
  const antenneList: Omit<Antenne, "id">[] = [];

  for (const structure of structures) {
    if (!structure.codeBhasile) continue;

    const nbAntennes = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < nbAntennes; i++) {
      antenneList.push({
        structureCodeBhasile: structure.codeBhasile,
        name: faker.lorem.words(2),
        adresse: faker.location.streetAddress(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      });
    }
  }

  return antenneList;
};

