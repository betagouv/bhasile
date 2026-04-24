import { fakerFR as faker } from "@faker-js/faker";

import { Operateur } from "@/generated/prisma/client";

import {
  createFakeDocumentOperateur,
  DocumentOperateurWithFileUploads,
} from "./document-operateur.seed";

type OperateurWithDocumentsFinanciers = Operateur & {
  documents: Omit<DocumentOperateurWithFileUploads, "id" | "operateurId">[];
};

export const createFakeOperateur = (
  index: number
): Omit<OperateurWithDocumentsFinanciers, "id"> => {
  return {
    name: `Opérateur ${index + 1}`,
    directionGenerale: faker.lorem.words(2),
    siret: faker.number.int(10000000000000).toString(),
    siegeSocial: faker.lorem.words(2),
    parentId: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
    documents: Array.from({ length: 5 }, () => createFakeDocumentOperateur()),
  };
};

export const createFakeFiliale = (
  parentOperateurId: number,
  parentOperateurName: string,
  index: number
): Omit<Operateur, "id"> => {
  const createdAt = faker.date.past();
  return {
    name: `${parentOperateurName} - Filiale ${index + 1}`,
    directionGenerale: faker.lorem.words(2),
    siret: faker.number.int(10000000000000).toString(),
    siegeSocial: faker.lorem.words(2),
    parentId: parentOperateurId,
    createdAt,
    updatedAt: createdAt,
  };
};
