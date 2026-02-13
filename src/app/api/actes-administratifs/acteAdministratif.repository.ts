import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { getKeysFromIncomingDocumentsOrActes } from "../files/file.service";

type ActeAdministratifOwnerId = {
  structureDnaCode?: string;
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

  await deleteActesAdministratifs(tx, actesAdministratifs, ownerId);

  const roots = actesAdministratifs.filter((a) => !a.parentId && !a.parentUuid);
  const children = actesAdministratifs.filter(
    (a) => a.parentId || a.parentUuid
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
      throw new Error(`Unable to resolve parentUuid: ${acte.parentUuid}`);
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
        parentId: parentId ?? acteAdministratif.parentId,
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
        parentId: parentId ?? acteAdministratif.parentId,
        fileUploads: {
          connect: acteAdministratif.fileUploads ?? [],
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
      parentId: parentId ?? acteAdministratif.parentId,
      fileUploads: {
        connect: acteAdministratif.fileUploads ?? [],
      },
    },
  });
};

const deleteActesAdministratifs = async (
  tx: PrismaTransaction,
  actesAdministratifsToKeep: ActeAdministratifApiType[],
  ownerId: ActeAdministratifOwnerId
): Promise<void> => {
  const where =
    ownerId.structureDnaCode !== undefined
      ? { structureDnaCode: ownerId.structureDnaCode }
      : { cpomId: ownerId.cpomId };

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

  await Promise.all(
    actesAdministratifsToDelete.map((acteAdministratif) =>
      tx.acteAdministratif.delete({ where: { id: acteAdministratif.id } })
    )
  );
};
