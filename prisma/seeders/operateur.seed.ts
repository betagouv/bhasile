import { fakerFR as faker } from "@faker-js/faker";

import { Contact, FileUpload, Operateur } from "@/generated/prisma/client";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import {
  ActeAdministratifWithFileUploads,
  createFakeActeAdministratif,
} from "./acte-administratif.seed";
import { createFakeContact } from "./contact.seed";
import { createFakeFileUpload } from "./file-upload.seed";

type OperateurWithRelations = Operateur & {
  actesAdministratifs: Omit<
    ActeAdministratifWithFileUploads,
    | "id"
    | "operateurId"
    | "structureId"
    | "structureDnaCode"
    | "cpomId"
    | "structureVersionTransformationId"
  >[];
  contacts: Omit<
    Contact,
    "id" | "structureDnaCode" | "structureId" | "operateurId"
  >[];
  logo: Omit<
    FileUpload,
    | "id"
    | "acteAdministratifId"
    | "documentFinancierId"
    | "controleId"
    | "evaluationId"
    | "operateurId"
  >;
};

const OPERATEUR_CATEGORIES: ActeAdministratifCategory[] = [
  "RAPPORT_ACTIVITE_OPERATEUR",
  "FRAIS_DE_SIEGE",
  "STATUTS",
  "AUTRE",
];

const createFakeOperateurActes = () =>
  Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
    ...createFakeActeAdministratif(),
    category: faker.helpers.arrayElement(OPERATEUR_CATEGORIES),
  }));

export const createFakeOperateur = (
  index: number
): Omit<OperateurWithRelations, "id"> => {
  return {
    name: `Opérateur ${index + 1}`,
    directionGenerale: faker.lorem.words(2),
    siret: faker.number.int(10000000000000).toString(),
    siegeSocial: faker.lorem.words(2),
    parentId: null,
    contacts: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
      createFakeContact()
    ),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
    actesAdministratifs: createFakeOperateurActes(),
    logo: createFakeFileUpload(),
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
