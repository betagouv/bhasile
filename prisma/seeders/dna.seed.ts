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

// dnaCode est porté par la ligne pour éviter de relire la base au moment de
// générer activités et événements indésirables graves.
export type DnaStructureSeed = {
  dnaId: number;
  dnaCode: string;
  structureVersionId: number;
  description: string;
};

export const createDnaStructures = ({
  dnas,
  perVersionCounts,
}: CreateDnaStructuresOptions): DnaStructureSeed[] => {
  const dnaStructures: DnaStructureSeed[] = [];

  let cursor = 0;
  for (const { structureVersionId, count } of perVersionCounts) {
    for (let i = 0; i < count; i++) {
      const dna = dnas[cursor++];

      dnaStructures.push({
        dnaId: dna.id,
        dnaCode: dna.code,
        structureVersionId,
        description: faker.lorem.words(2),
      });
    }
  }
  return dnaStructures;
};

type CreateDnaStructuresOptions = {
  dnas: { id: number; code: string }[];
  perVersionCounts: { structureVersionId: number; count: number }[];
};
