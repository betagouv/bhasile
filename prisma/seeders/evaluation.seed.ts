import { fakerFR as faker } from "@faker-js/faker";

import { EVALUATION_NOTE_MAX, EVALUATION_NOTE_MIN } from "@/constants";
import { Evaluation } from "@/generated/prisma/client";

import { createFakeFileUpload } from "./file-upload.seed";

export type EvaluationWithFileUploads = Evaluation & {
  fileUploads: ReturnType<typeof createFakeFileUpload>[];
};

export const createFakeEvaluation = (): Omit<
  EvaluationWithFileUploads,
  "id" | "structureDnaCode" | "structureId"
> => {
  const notePro = createFakeNote();
  const notePersonne = createFakeNote();
  const noteStructure = createFakeNote();

  return {
    date: faker.date.past(),
    notePro,
    notePersonne,
    noteStructure,
    fileUploads: [createFakeFileUpload()],
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};

const createFakeNote = (): number =>
  faker.number.float({
    min: EVALUATION_NOTE_MIN,
    max: EVALUATION_NOTE_MAX,
    fractionDigits: 1,
  });
