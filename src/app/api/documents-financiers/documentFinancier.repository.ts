import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { PrismaTransaction } from "@/types/prisma.type";

type DocumentFinancierOwnerId =
  | { structureDnaCode: string; cpomId?: never }
  | { structureDnaCode?: never; cpomId: number };

const deleteDocumentsFinanciers = async (
  tx: PrismaTransaction,
  documentsFinanciersToKeep: DocumentFinancierApiType[],
  ownerId: DocumentFinancierOwnerId
): Promise<void> => {
  const where =
    "structureDnaCode" in ownerId
      ? { structureDnaCode: ownerId.structureDnaCode }
      : { cpomId: ownerId.cpomId };

  const allDocumentsFinanciers = await tx.documentFinancier.findMany({
    where,
  });
  const documentsFinanciersToDelete = allDocumentsFinanciers.filter(
    (documentFinancier) =>
      !documentsFinanciersToKeep.some(
        (documentFinancierToKeep) =>
          documentFinancierToKeep.id === documentFinancier.id
      )
  );
  await Promise.all(
    documentsFinanciersToDelete.map((documentFinancier) =>
      tx.documentFinancier.delete({ where: { id: documentFinancier.id } })
    )
  );
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

  const ownerData =
    "structureDnaCode" in ownerId
      ? { structureDnaCode: ownerId.structureDnaCode, cpomId: null }
      : { structureDnaCode: null, cpomId: ownerId.cpomId };

  await Promise.all(
    (documentsFinanciers || []).map((documentFinancier) => {
      return tx.documentFinancier.upsert({
        where: { id: documentFinancier.id || 0 },
        update: {
          ...ownerData,
          category: documentFinancier.category,
          year: documentFinancier.year,
          name: documentFinancier.name,
          fileUploads: {
            connect: documentFinancier.fileUploads,
          },
        },
        create: {
          ...ownerData,
          category: documentFinancier.category,
          year: documentFinancier.year,
          name: documentFinancier.name,
          fileUploads: {
            connect: documentFinancier.fileUploads,
          },
        },
      });
    })
  );
};
