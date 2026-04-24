import { fakerFR as faker } from "@faker-js/faker";

import {
  DocumentOperateur,
  DocumentOperateurCategory,
} from "@/generated/prisma/client";

import { createFakeFileUpload } from "./file-upload.seed";

export type DocumentOperateurWithFileUploads = DocumentOperateur & {
  fileUploads: ReturnType<typeof createFakeFileUpload>[];
};

export const createFakeDocumentOperateur = (): Omit<
  DocumentOperateurWithFileUploads,
  "id" | "operateurId"
> => {
  return {
    date: faker.date.past(),
    name: faker.lorem.word(),
    category: faker.helpers.enumValue(DocumentOperateurCategory),
    fileUploads: [
      createFakeFileUpload(),
      createFakeFileUpload(),
      createFakeFileUpload(),
    ],
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
