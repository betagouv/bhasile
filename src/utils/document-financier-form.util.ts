import { FileUploadResponse } from "@/app/hooks/useFileUpload";
import { hasDocumentFile } from "@/app/utils/document-financier.util";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { DocumentFinancierCategory } from "@/types/document-financier.type";
import { StructureType } from "@/types/structure.type";

export const isDocumentFinancierInSlot = (
  documentFinancier: DocumentFinancierFlexibleFormValues,
  slot: DocumentFinancierSlot
): boolean =>
  documentFinancier.year === slot.year &&
  documentFinancier.category === slot.category &&
  // Un document déjà enregistré revient de l'API avec structureType à null,
  // alors que le formulaire le laisse absent hors périmètre CPOM.
  (documentFinancier.structureType ?? null) === (slot.structureType ?? null);

export const findDocumentFinancierWithFile = (
  documentsFinanciers: DocumentFinancierFlexibleFormValues[],
  slot: DocumentFinancierSlot
): DocumentFinancierFlexibleFormValues | undefined =>
  documentsFinanciers.find(
    (documentFinancier) =>
      isDocumentFinancierInSlot(documentFinancier, slot) &&
      hasDocumentFile(documentFinancier)
  );

export const getDocumentFinancierRowKey = (
  documentFinancier: DocumentFinancierFlexibleFormValues
): string => {
  if (documentFinancier.uuid) {
    return documentFinancier.uuid;
  }
  if (documentFinancier.id !== undefined) {
    return `id-${documentFinancier.id}`;
  }
  return `file-${documentFinancier.fileUploads?.[0]?.key}`;
};

export const addDocumentFinancierFileToSlot = (
  documentsFinanciers: DocumentFinancierFlexibleFormValues[],
  slot: DocumentFinancierSlot,
  fileUpload: FileUploadResponse,
  uuid: string
): DocumentFinancierFlexibleFormValues[] => [
  ...documentsFinanciers.filter(
    (documentFinancier) =>
      !isDocumentFinancierInSlot(documentFinancier, slot) ||
      hasDocumentFile(documentFinancier)
  ),
  {
    uuid,
    year: slot.year,
    category: slot.category,
    structureType: slot.structureType ?? undefined,
    fileUploads: [fileUpload],
  },
];

export const removeDocumentFinancierByFileKey = (
  documentsFinanciers: DocumentFinancierFlexibleFormValues[],
  fileKey: string
): DocumentFinancierFlexibleFormValues[] =>
  documentsFinanciers.filter(
    (documentFinancier) => documentFinancier.fileUploads?.[0]?.key !== fileKey
  );

export const updateDocumentFinancierRow = (
  documentsFinanciers: DocumentFinancierFlexibleFormValues[],
  row: DocumentFinancierFlexibleFormValues,
  changes: Partial<DocumentFinancierFlexibleFormValues>,
  { canCreate }: { canCreate: boolean }
): DocumentFinancierFlexibleFormValues[] => {
  const rowKey = getDocumentFinancierRowKey(row);
  const hasRow = documentsFinanciers.some(
    (documentFinancier) =>
      getDocumentFinancierRowKey(documentFinancier) === rowKey
  );
  if (!hasRow) {
    // Une ligne absente a pu être supprimée pendant un upload : seule une
    // ligne jamais supprimée a le droit d'être créée ici.
    return canCreate
      ? [...documentsFinanciers, { ...row, ...changes }]
      : documentsFinanciers;
  }
  return documentsFinanciers.map((documentFinancier) =>
    getDocumentFinancierRowKey(documentFinancier) === rowKey
      ? { ...documentFinancier, ...changes }
      : documentFinancier
  );
};

export const removeDocumentFinancierRow = (
  documentsFinanciers: DocumentFinancierFlexibleFormValues[],
  rowKey: string
): DocumentFinancierFlexibleFormValues[] =>
  documentsFinanciers.filter(
    (documentFinancier) =>
      getDocumentFinancierRowKey(documentFinancier) !== rowKey
  );

export type DocumentFinancierSlot = {
  year: number;
  category: DocumentFinancierCategory;
  structureType?: StructureType | null;
};
