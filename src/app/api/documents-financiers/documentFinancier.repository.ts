import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { getKeysFromIncomingDocumentsOrActes } from "../files/file.service";

type DocumentFinancierOwnerId = {
  structureDnaCode?: string;
  cpomId?: number;
};

export const createOrUpdateDocumentsFinanciers = async (
  tx: PrismaTransaction,
  documentsFinanciers: DocumentFinancierApiType[] | undefined,
  ownerId: DocumentFinancierOwnerId
): Promise<void> => {
  if (!documentsFinanciers || documentsFinanciers.length === 0) {
    return;
  }

  await deleteDocumentsFinanciers(tx, documentsFinanciers, ownerId);

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
          ...ownerId,
          category: documentFinancier.category,
          year: documentFinancier.year,
          name: documentFinancier.name,
          granularity: documentFinancier.granularity,
          fileUploads: {
            connect: documentFinancier.fileUploads ?? [],
          },
        },
      });
    } else {
      await tx.documentFinancier.create({
        data: {
          ...ownerId,
          category: documentFinancier.category,
          year: documentFinancier.year,
          name: documentFinancier.name,
          granularity: documentFinancier.granularity,
          fileUploads: {
            connect: documentFinancier.fileUploads ?? [],
          },
        },
      });
    }
  }
};

const deleteDocumentsFinanciers = async (
  tx: PrismaTransaction,
  documentsFinanciersToKeep: DocumentFinancierApiType[],
  ownerId: DocumentFinancierOwnerId
): Promise<void> => {
  const where =
    "structureDnaCode" in ownerId
      ? { structureDnaCode: ownerId.structureDnaCode }
      : { cpomId: ownerId.cpomId };

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
