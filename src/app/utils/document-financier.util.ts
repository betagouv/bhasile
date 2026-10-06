import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { DocumentFinancierCategory } from "@/types/document-financier.type";

export const getCpomInheritedDocumentsFinanciers = (
  structure: StructureApiRead
): DocumentFinancierApiType[] =>
  structure.cpomStructures
    ?.flatMap((cpomStructure) => cpomStructure.cpom?.documentsFinanciers ?? [])
    .filter(
      (documentFinancier) =>
        !!documentFinancier.structureType &&
        documentFinancier.structureType === structure.type
    ) ?? [];

export const getCpomCoveredDocumentsFinanciers = (
  structure: StructureApiRead
): DocumentFinancierApiType[] =>
  getCpomInheritedDocumentsFinanciers(structure).filter((documentFinancier) =>
    Boolean(documentFinancier.fileUploads?.[0]?.key)
  );

export const isDocumentCoveredByCpom = (
  coveredDocumentsFinanciers: DocumentFinancierApiType[],
  category: DocumentFinancierCategory,
  year: number
): boolean =>
  coveredDocumentsFinanciers.some(
    (documentFinancier) =>
      documentFinancier.category === category && documentFinancier.year === year
  );
