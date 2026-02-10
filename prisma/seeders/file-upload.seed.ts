import { fakerFR as faker } from "@faker-js/faker";

import { FileUpload } from "@/generated/prisma/client";

export const createFakeFileUpload = (): Omit<
  FileUpload,
  | "id"
  | "acteAdministratifId"
  | "documentFinancierId"
  | "controleId"
  | "evaluationId"
> => {
  const { mime, ext } = randomDocFile();
  const fileName = faker.system.commonFileName(ext);

  return {
    key: `${faker.string.uuid()}-${fileName}`,
    mimeType: mime,
    fileSize: faker.number.int({ min: 1, max: 100000 }),
    originalName: fileName,
    granularity: null,
    structureDnaCode: null,
    cpomId: null,
    date: null,
    category: null,
    startDate: null,
    endDate: null,
    categoryName: null,
    parentFileUploadId: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};

const docMimeMap = [
  { mime: "application/pdf", ext: "pdf" },
  { mime: "application/msword", ext: "doc" },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "docx",
  },
  { mime: "application/vnd.oasis.opendocument.text", ext: "odt" },
  { mime: "application/vnd.oasis.opendocument.spreadsheet", ext: "ods" },
  { mime: "application/vnd.oasis.opendocument.presentation", ext: "odp" },
];

const randomDocFile = () => {
  return faker.helpers.arrayElement(docMimeMap);
};
