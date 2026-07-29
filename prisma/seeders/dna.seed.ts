import { fakerFR as faker } from "@faker-js/faker";

import { Dna, StructureType } from "@/generated/prisma/client";

const DNA_TYPES = ["C", "H", "K", "R"] as const;

export const createDnaList = (
  count: number,
  { operateurIds, departementNumeros }: DnaSeedRefs
): Omit<Dna, "id">[] => {
  const dnaList: Omit<Dna, "id">[] = [];

  for (let i = 0; i < count; i++) {
    const type = DNA_TYPES[i % DNA_TYPES.length];
    const numero = Math.floor(i / DNA_TYPES.length) + 1;
    const code = `${type}-${String(numero).padStart(3, "0")}`;

    dnaList.push({
      code,
      activeInOfiiFileSince:
        faker.helpers.maybe(() => faker.date.past({ years: 4 }), {
          probability: 0.1,
        }) ?? null,
      inactiveInOfiiFileSince:
        faker.helpers.maybe(() => faker.date.past({ years: 2 }), {
          probability: 0.05,
        }) ?? null,
      departementAdministratif: faker.helpers.arrayElement(departementNumeros),
      directionTerritoriale: "DT " + faker.location.city(),
      nom: faker.company.name(),
      nomOfii: faker.company.name(),
      operateurId: faker.helpers.arrayElement(operateurIds),
      type: faker.helpers.arrayElement([
        StructureType.CADA,
        StructureType.HUDA,
        StructureType.CAES,
        StructureType.CPH,
      ]),
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    });
  }

  return dnaList;
};

type DnaSeedRefs = {
  operateurIds: number[];
  departementNumeros: string[];
};

export const createDnaStructures = ({
  dnaList,
  dnaByCode,
  perVersionCounts,
}: CreateDnaStructuresOptions) => {
  const dnaStructures: Array<{
    dnaId: number;
    structureVersionId: number;
    description: string;
  }> = [];

  let cursor = 0;
  for (const { structureVersionId, count } of perVersionCounts) {
    for (let i = 0; i < count; i++) {
      const dna = dnaList[cursor++];
      const dnaId = dnaByCode.get(dna.code);
      if (!dnaId) {
        continue;
      }

      dnaStructures.push({
        dnaId,
        structureVersionId,
        description: faker.lorem.words(2),
      });
    }
  }
  return dnaStructures;
};

type CreateDnaStructuresOptions = {
  dnaList: Omit<Dna, "id">[];
  dnaByCode: Map<string, number>;
  perVersionCounts: { structureVersionId: number; count: number }[];
};
