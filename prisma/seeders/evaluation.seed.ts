import { fakerFR as faker } from "@faker-js/faker";

import {
  Evaluation,
  FileUpload,
  FileUploadCategory,
} from "@/generated/prisma/client";

import { createFakeFileUpload } from "./file-upload.seed";

export type EvaluationWithFileUploads = Evaluation & {
  fileUploads: Omit<
    FileUpload,
    "id" | "controleId" | "evaluationId" | "structureDnaCode" | "cpomId"
  >[];
};

export const createFakeEvaluation = (): Omit<
  EvaluationWithFileUploads,
  "id" | "structureDnaCode"
> => {
  return {
    date: faker.date.past(),
    note: faker.number.float({ min: 0, max: 4, fractionDigits: 1 }),
    notePro: faker.number.float({ min: 0, max: 4, fractionDigits: 1 }),
    notePersonne: faker.number.float({ min: 0, max: 4, fractionDigits: 1 }),
    noteStructure: faker.number.float({ min: 0, max: 4, fractionDigits: 1 }),
    fileUploads: [
      createFakeFileUpload({
        category: FileUploadCategory.EVALUATION,
      }),
    ],
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
