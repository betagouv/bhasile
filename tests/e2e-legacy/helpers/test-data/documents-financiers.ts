import {
  isDocumentStillRequired,
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { StructureType } from "@/types/structure.type";

import { TestStructureData } from "./types";

export type DocumentFinancierUpload =
  TestStructureData["documentsFinanciers"]["fileUploads"][number];

export const buildRequiredDocumentsFinanciers = ({
  structureType,
  startYear,
  resolveFormKind = () => "ajout",
}: {
  structureType: StructureType;
  startYear?: number;
  resolveFormKind?: (
    document: DocumentFinancierUpload
  ) => "ajout" | "finalisation";
}): DocumentFinancierUpload[] => {
  const documents = isStructureAutorisee(structureType)
    ? structureAutoriseesDocuments
    : structureSubventionneesDocuments;
  const { years } = getYearRange();

  return years
    .filter((year) => (startYear ? year >= startYear : true))
    .flatMap((year) =>
      documents
        .filter((document) => isDocumentStillRequired(document, year))
        .map((document) => {
          const upload: DocumentFinancierUpload = {
            year: String(year),
            category: document.label,
            fileName: "sample.csv",
            filePath: "tests/e2e/fixtures/sample.csv",
            formKind: "ajout",
          };
          return { ...upload, formKind: resolveFormKind(upload) };
        })
    );
};
