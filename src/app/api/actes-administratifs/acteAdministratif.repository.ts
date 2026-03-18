import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { getKeysFromIncomingDocumentsOrActes } from "../files/file.service";

type ActeAdministratifOwnerId = {
  structureId?: number;
  cpomId?: number;
};

export const createOrUpdateActesAdministratifs = async (
  tx: PrismaTransaction,
  actesAdministratifs: ActeAdministratifApiType[] | undefined,
  ownerId: ActeAdministratifOwnerId
): Promise<void> => {
  if (!actesAdministratifs || actesAdministratifs.length === 0) {
    return;
  }

  const deletedIds = new Set(
    await deleteActesAdministratifs(tx, actesAdministratifs, ownerId)
  );

  const roots = actesAdministratifs.filter(
    (acteAdministratif) =>
      !acteAdministratif.parentId && !acteAdministratif.parentUuid
  );
  const children = actesAdministratifs.filter(
    (acteAdministratif) =>
      acteAdministratif.parentId || acteAdministratif.parentUuid
  );

  const uuidToId = new Map<string, number>();

  for (const acte of roots) {
    const result = await createOrUpdateActeAdministratif(tx, acte, ownerId);
    if (acte.uuid) {
      uuidToId.set(acte.uuid, result.id);
    }
  }

  for (const acte of children) {
    const resolvedParentId =
      acte.parentId ??
      (acte.parentUuid ? uuidToId.get(acte.parentUuid) : undefined);
    if (!resolvedParentId && acte.parentUuid) {
      continue;
    }
    if (resolvedParentId !== undefined && deletedIds.has(resolvedParentId)) {
      continue;
    }
    await createOrUpdateActeAdministratif(tx, acte, ownerId, resolvedParentId);
  }
};

const createOrUpdateActeAdministratif = async (
  tx: PrismaTransaction,
  acteAdministratif: ActeAdministratifApiType,
  ownerId: { structureDnaCode?: string; cpomId?: number },
  parentId?: number
) => {
  const realParentId = (parentId ?? acteAdministratif.parentId) || undefined;

  const fileKey = acteAdministratif.fileUploads?.[0]?.key;
  if (!fileKey) {
    return tx.acteAdministratif.create({
      data: {
        ...ownerId,
        category: acteAdministratif.category,
        date: acteAdministratif.date,
        startDate: acteAdministratif.startDate,
        endDate: acteAdministratif.endDate,
        name: acteAdministratif.name,
        parentId: realParentId,
      },
    });
  }

  const existingFileUpload = await tx.fileUpload.findUnique({
    where: { key: fileKey },
    select: { acteAdministratifId: true },
  });
  if (existingFileUpload?.acteAdministratifId) {
    return tx.acteAdministratif.update({
      where: { id: existingFileUpload.acteAdministratifId },
      data: {
        ...ownerId,
        category: acteAdministratif.category,
        date: acteAdministratif.date,
        startDate: acteAdministratif.startDate,
        endDate: acteAdministratif.endDate,
        name: acteAdministratif.name,
        parentId: realParentId,
        fileUploads: {
          connect: (acteAdministratif.fileUploads ?? []).map((fileUpload) => ({
            key: fileUpload?.key,
          })),
        },
      },
    });
  }

  return tx.acteAdministratif.create({
    data: {
      ...ownerId,
      category: acteAdministratif.category,
      date: acteAdministratif.date,
      startDate: acteAdministratif.startDate,
      endDate: acteAdministratif.endDate,
      name: acteAdministratif.name,
      parentId: realParentId,
      fileUploads: {
        connect: (acteAdministratif.fileUploads ?? []).map((fileUpload) => ({
          key: fileUpload?.key,
        })),
      },
    },
  });
};

const deleteActesAdministratifs = async (
  tx: PrismaTransaction,
  actesAdministratifsToKeep: ActeAdministratifApiType[],
  ownerId: ActeAdministratifOwnerId
): Promise<number[]> => {
  const where =
    ownerId.structureId !== undefined
      ? { structureId: ownerId.structureId }
      : { cpomId: ownerId.cpomId };

  if (ownerId.structureId === undefined && ownerId.cpomId === undefined) {
    return [];
  }

  const fileKeysToKeep = getKeysFromIncomingDocumentsOrActes(
    actesAdministratifsToKeep
  );

  const allActesAdministratifs = await tx.acteAdministratif.findMany({
    where,
    include: { fileUploads: true },
  });

  const actesAdministratifsToDelete = allActesAdministratifs.filter(
    (acteAdministratif) => {
      const hasMatchingFile = acteAdministratif.fileUploads.some((file) =>
        fileKeysToKeep.has(file.key)
      );
      return !hasMatchingFile;
    }
  );

  const deletedIds: number[] = [];

  await Promise.all(
    actesAdministratifsToDelete.map(async (acteAdministratif) => {
      try {
        await tx.acteAdministratif.delete({
          where: { id: acteAdministratif.id },
        });
      } catch (error) {
        console.error(
          `Error deleting acteAdministratif ${acteAdministratif.id}:`,
          error
        );
      } finally {
        deletedIds.push(acteAdministratif.id);
      }
    })
  );

  return deletedIds;
};
