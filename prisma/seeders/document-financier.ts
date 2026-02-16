import { fakerFR as faker } from "@faker-js/faker";

import {
  DocumentFinancier,
  DocumentFinancierCategory,
  DocumentFinancierGranularity,
  FileUpload,
} from "@/generated/prisma/client";

import { createFakeFileUpload } from "./file-upload.seed";

export type DocumentFinancierWithFileUploads = DocumentFinancier & {
  fileUploads: Omit<
    FileUpload,
    | "id"
    | "acteAdministratifId"
    | "documentFinancierId"
    | "controleId"
    | "evaluationId"
  >[];
};

export const createFakeDocumentFinancier = (): Omit<
  DocumentFinancierWithFileUploads,
  "id" | "structureDnaCode" | "cpomId"
> => {
  return {
    year: faker.number.int({ min: 2021, max: 2025 }),
    name: faker.lorem.word(),
    category: faker.helpers.enumValue(DocumentFinancierCategory),
    granularity: faker.helpers.enumValue(DocumentFinancierGranularity),
    fileUploads: [createFakeFileUpload()],
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
