import { fakerFR as faker } from "@faker-js/faker";

import { Antenne } from "@/generated/prisma/client";

type VersionForAntenne = {
  structureVersionId: number;
};

export const createAntenneList = (
  versions: VersionForAntenne[]
): Omit<Antenne, "id">[] => {
  const antenneList: Omit<Antenne, "id">[] = [];

  for (const version of versions) {
    const nbAntennes = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < nbAntennes; i++) {
      antenneList.push({
        structureId: null,
        structureVersionId: version.structureVersionId,
        name: faker.lorem.words(2),
        adresse: faker.location.streetAddress(),
        codePostal: faker.location.zipCode(),
        commune: faker.location.city(),
        departement: faker.location.state(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      });
    }
  }

  return antenneList;
};
