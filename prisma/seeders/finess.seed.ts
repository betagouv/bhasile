import { Finess } from "@/generated/prisma/client";
import { fakerFR as faker } from "@faker-js/faker";

type StructureWithCodeBhasile = {
  codeBhasile: string | null;
};

/**
 * Génère entre 1 et 3 codes FINESS par structure ayant un codeBhasile,
 * avec des codes FINESS uniques globalement.
 */
export const createFinessList = (
  structures: StructureWithCodeBhasile[]
): Omit<Finess, "id">[] => {
  const list: Omit<Finess, "id">[] = [];
  let counter = 0;

  for (const structure of structures) {
    if (!structure.codeBhasile) continue;

    const nbFiness = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < nbFiness; i++) {
      const code = (100000000 + counter++).toString();
      list.push({
        code,
        structureCodeBhasile: structure.codeBhasile,
        granularity: faker.word.noun(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      });
    }
  }

  return list;
};
