import { fakerFR as faker } from "@faker-js/faker";

import { Operateur } from "@/generated/prisma/client";

import {
  ActeAdministratifWithFileUploads,
  createFakeActeAdministratif,
} from "./acte-administratif.seed";
import {
  createFakeDocumentFinancier,
  DocumentFinancierWithFileUploads,
} from "./document-financier";

type OperateurWithDocuments = Operateur & {
  actesAdministratifs: Omit<
    ActeAdministratifWithFileUploads,
    "id" | "operateurId" | "structureId" | "structureDnaCode" | "cpomId"
  >[];
  documentsFinanciers: Omit<
    DocumentFinancierWithFileUploads,
    "id" | "operateurId" | "structureId" | "structureDnaCode" | "cpomId"
  >[];
};

export const createFakeOperateur = (
  index: number
): Omit<OperateurWithDocuments, "id"> => {
  return {
    name: `Opérateur ${index + 1}`,
    directionGenerale: faker.lorem.words(2),
    siret: faker.number.int(10000000000000).toString(),
    siegeSocial: faker.lorem.words(2),
    parentId: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
    actesAdministratifs: Array.from({ length: 3 }, () =>
      createFakeActeAdministratif()
    ),
    documentsFinanciers: Array.from({ length: 3 }, () =>
      createFakeDocumentFinancier()
    ),
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
