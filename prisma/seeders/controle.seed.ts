import { fakerFR as faker } from "@faker-js/faker";

import { Controle, ControleType } from "@/generated/prisma/client";

import { createFakeFileUpload } from "./file-upload.seed";

export type ControleWithFileUploads = Controle & {
  fileUploads: ReturnType<typeof createFakeFileUpload>[];
};

export const createFakeControle = (): Omit<
  ControleWithFileUploads,
  "id" | "structureDnaCode"
> => {
  return {
    date: faker.date.past(),
    type: faker.helpers.enumValue(ControleType),
    fileUploads: [createFakeFileUpload()],
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
