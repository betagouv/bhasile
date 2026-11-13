import { fakerFR as faker } from "@faker-js/faker";

import {
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { DOCUMENTS_FINANCIERS_OPEN_YEAR, START_YEAR } from "@/constants";
import { DocumentFinancier } from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";

import { createFakeFileUpload } from "./file-upload.seed";

export type DocumentFinancierWithFileUploads = DocumentFinancier & {
  fileUploads: ReturnType<typeof createFakeFileUpload>[];
};

export const createFakeDocumentsFinanciers = (
  structureType: StructureType,
  count: number
): Omit<
  DocumentFinancierWithFileUploads,
  | "id"
  | "structureDnaCode"
  | "cpomId"
  | "structureId"
  | "granularity"
  | "sourceTarificationDocumentId"
>[] => {
  const documentTypes = isStructureAutorisee(structureType)
    ? structureAutoriseesDocuments
    : structureSubventionneesDocuments;
  const { years } = getYearRange({
    startYear: START_YEAR,
    endYear: DOCUMENTS_FINANCIERS_OPEN_YEAR,
  });
  const slots = years.flatMap((year) =>
    documentTypes.map((documentType) => ({
      year,
      category: documentType.value,
    }))
  );

  return faker.helpers
    .arrayElements(slots, count)
    .map(({ year, category }) => ({
      year,
      category,
      name: category === "AUTRE_FINANCIER" ? faker.lorem.words(2) : null,
      structureType: null,
      fileUploads: [createFakeFileUpload()],
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    }));
};
