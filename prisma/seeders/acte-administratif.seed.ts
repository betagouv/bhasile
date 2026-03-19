import { fakerFR as faker } from "@faker-js/faker";

import {
  ActeAdministratif,
  ActeAdministratifCategory,
} from "@/generated/prisma/client";

import { createFakeFileUpload } from "./file-upload.seed";

export type ActeAdministratifWithFileUploads = ActeAdministratif & {
  fileUploads: ReturnType<typeof createFakeFileUpload>[];
};

export const createFakeActeAdministratif = (): Omit<
  ActeAdministratifWithFileUploads,
  "id" | "structureDnaCode" | "cpomId" | "structureId"
> => {
  return {
    date: faker.date.past(),
    name: faker.lorem.word(),
    category: faker.helpers.enumValue(ActeAdministratifCategory),
    startDate: faker.date.past(),
    endDate: faker.date.future(),
    parentId: null,
    fileUploads: [createFakeFileUpload()],
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
