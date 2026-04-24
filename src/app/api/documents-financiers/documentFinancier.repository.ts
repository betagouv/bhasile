import { DocumentFinancierApiType } from "@/schemas/api/document-financier.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { getKeysFromIncomingDocumentsOrActes } from "../files/file.service";

export const createOrUpdateDocumentsFinanciers = async (
  tx: PrismaTransaction,
  documentsFinanciers: DocumentFinancierApiType[] | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!documentsFinanciers || documentsFinanciers.length === 0) {
    return;
  }

  await deleteDocumentsFinanciers(tx, documentsFinanciers, entityId);

  for (const documentFinancier of documentsFinanciers) {
    const key = documentFinancier.fileUploads?.[0]?.key;
    if (!key) {
      continue;
    }

    const existingFileUpload = await tx.fileUpload.findUnique({
      where: { key },
      select: { documentFinancierId: true },
    });

    if (existingFileUpload?.documentFinancierId) {
      await tx.documentFinancier.update({
        where: { id: existingFileUpload.documentFinancierId },
        data: {
          ...entityId,
          category: documentFinancier.category,
          year: documentFinancier.year,
          name: documentFinancier.name,
          granularity: documentFinancier.granularity,
          fileUploads: {
            connect: (documentFinancier.fileUploads ?? []).map(
              (fileUpload) => ({
                key: fileUpload.key,
              })
            ),
          },
        },
      });
    } else {
      await tx.documentFinancier.create({
        data: {
          ...entityId,
          category: documentFinancier.category,
          year: documentFinancier.year,
          name: documentFinancier.name,
          granularity: documentFinancier.granularity,
          fileUploads: {
            connect: (documentFinancier.fileUploads ?? []).map(
              (fileUpload) => ({
                key: fileUpload.key,
              })
            ),
          },
        },
      });
    }
  }
};

const deleteDocumentsFinanciers = async (
  tx: PrismaTransaction,
  documentsFinanciersToKeep: DocumentFinancierApiType[],
  entityId: EntityId
): Promise<void> => {
  const where =
    entityId.structureId !== undefined
      ? { structureId: entityId.structureId }
      : { cpomId: entityId.cpomId };

  if (entityId.structureId === undefined && entityId.cpomId === undefined) {
    return;
  }

  const KeysToKeep = getKeysFromIncomingDocumentsOrActes(
    documentsFinanciersToKeep
  );

  const allDocumentsFinanciers = await tx.documentFinancier.findMany({
    where,
    include: { fileUploads: true },
  });

  const documentsFinanciersToDelete = allDocumentsFinanciers.filter(
    (documentFinancier) => {
      const hasMatchingFile = documentFinancier.fileUploads.some((file) =>
        KeysToKeep.has(file.key)
      );
      return !hasMatchingFile;
    }
  );

  await Promise.all(
    documentsFinanciersToDelete.map((documentFinancier) =>
      tx.documentFinancier.delete({ where: { id: documentFinancier.id } })
    )
  );
};
