import { fakerFR as faker } from "@faker-js/faker";

import {
  Controle,
  ControleType,
  FileUpload,
  FileUploadCategory,
} from "@/generated/prisma/client";

import { createFakeFileUpload } from "./file-upload.seed";

export type ControleWithFileUploads = Controle & {
  fileUploads: Omit<
    FileUpload,
    "id" | "controleId" | "evaluationId" | "structureDnaCode" | "structureId"
  >[];
};

export const createFakeControle = (): Omit<
  ControleWithFileUploads,
  "id" | "structureDnaCode" | "structureId"
> => {
  return {
    date: faker.date.past(),
    type: faker.helpers.enumValue(ControleType),
    fileUploads: [
      createFakeFileUpload({
        category: FileUploadCategory.INSPECTION_CONTROLE,
      }),
    ],
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
