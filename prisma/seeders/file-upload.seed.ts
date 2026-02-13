import { fakerFR as faker } from "@faker-js/faker";

import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import {
  FileUpload,
  FileUploadCategory,
  FileUploadGranularity,
} from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";

import { generateDatePair } from "../utils/common.util";

export const createFakeFileUpload = ({
  category,
  cpom,
  structureType,
}: CreateFakeFileUploadOptions): Omit<
  FileUpload,
  "id" | "structureDnaCode" | "controleId" | "evaluationId" | "cpomId"
> => {
  return buildFakeFileUpload({
    category,
    cpom,
    structureType,
  });
};

export const createFakeFileUploadWithParent = ({
  parentFileUploadId,
}: CreateFakeFileUploadWithParentOptions): Omit<
  FileUpload,
  "id" | "structureDnaCode" | "controleId" | "evaluationId" | "cpomId"
> => {
  return buildFakeFileUpload({
    parentFileUploadId,
  });
};

const getFakeFileUploadCategories = (
  cpom?: boolean,
  structureType?: StructureType
): FileUploadCategory[] => {
  const cpomValue = cpom ?? faker.datatype.boolean();
  const structureTypeValue =
    structureType ?? faker.helpers.enumValue(StructureType);
  const categories = Object.values(FileUploadCategory).filter((category) => {
    if (isStructureAutorisee(structureTypeValue) && cpomValue) {
      return true;
    }
    if (isStructureAutorisee(structureTypeValue) && !cpomValue) {
      return category !== FileUploadCategory.CPOM;
    }
    if (isStructureSubventionnee(structureTypeValue) && cpomValue) {
      return (
        category !== FileUploadCategory.ARRETE_AUTORISATION &&
        category !== FileUploadCategory.ARRETE_TARIFICATION
      );
    }
    if (isStructureSubventionnee(structureTypeValue) && !cpomValue) {
      return (
        category !== FileUploadCategory.ARRETE_AUTORISATION &&
        category !== FileUploadCategory.ARRETE_TARIFICATION &&
        category !== FileUploadCategory.CPOM
      );
    }
    return true;
  });

  return categories as FileUploadCategory[];
};

const buildFakeFileUpload = ({
  category,
  cpom,
  structureType,
  parentFileUploadId,
}: BuildFakeFileUploadOptions): Omit<
  FileUpload,
  "id" | "structureDnaCode" | "controleId" | "evaluationId" | "cpomId"
> => {
  const fakeCategories = getFakeFileUploadCategories(cpom, structureType);
  const [startDate, endDate] = generateDatePair();
  const { mime, ext } = randomDocFile();
  const fileName = faker.system.commonFileName(ext);

  return {
    key: `${faker.string.uuid()}-${fileName}`,
    mimeType: mime,
    fileSize: faker.number.int({ min: 1, max: 100000 }),
    originalName: fileName,
    date: faker.date.past(),
    category: category ?? faker.helpers.arrayElement(fakeCategories),
    startDate,
    endDate,
    categoryName:
      category === FileUploadCategory.AUTRE ? faker.lorem.word() : null,
    parentFileUploadId: parentFileUploadId ?? null,
    granularity: FileUploadGranularity.STRUCTURE,
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

type BuildFakeFileUploadOptions = {
  category?: FileUploadCategory;
  cpom?: boolean;
  structureType?: StructureType;
  parentFileUploadId?: number;
};

type CreateFakeFileUploadOptions = {
  category?: FileUploadCategory;
  cpom?: boolean;
  structureType?: StructureType;
  parentFileUploadId?: number;
};

type CreateFakeFileUploadWithParentOptions = {
  parentFileUploadId: number;
};
