import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { PrismaTransaction } from "@/types/prisma.type";

type ActeAdministratifOwnerId =
  | { structureDnaCode: string; cpomId?: never }
  | { structureDnaCode?: never; cpomId: number };

const deleteActesAdministratifs = async (
  tx: PrismaTransaction,
  actesAdministratifsToKeep: ActeAdministratifApiType[],
  ownerId: ActeAdministratifOwnerId
): Promise<void> => {
  const where =
    "structureDnaCode" in ownerId
      ? { structureDnaCode: ownerId.structureDnaCode }
      : { cpomId: ownerId.cpomId };

  const allActesAdministratifs = await tx.acteAdministratif.findMany({
    where,
  });
  const actesAdministratifsToDelete = allActesAdministratifs.filter(
    (acteAdministratif) =>
      !actesAdministratifsToKeep.some(
        (acteAdministratifToKeep) =>
          acteAdministratifToKeep.id === acteAdministratif.id
      )
  );
  await Promise.all(
    actesAdministratifsToDelete.map((acteAdministratif) =>
      tx.acteAdministratif.delete({ where: { id: acteAdministratif.id } })
    )
  );
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

  const ownerData =
    "structureDnaCode" in ownerId
      ? { structureDnaCode: ownerId.structureDnaCode, cpomId: null }
      : { structureDnaCode: null, cpomId: ownerId.cpomId };

  const roots = actesAdministratifs.filter((a) => !a.parentId && !a.parentUuid);
  const children = actesAdministratifs.filter(
    (a) => a.parentId || a.parentUuid
  );

  const uuidToId = new Map<string, number>();

  for (const acte of roots) {
    const result = await upsertActeAdministratif(tx, acte, ownerData);
    if (acte.uuid && !acte.id) {
      uuidToId.set(acte.uuid, result.id);
    }
  }

  for (const acte of children) {
    const resolvedParentId =
      acte.parentId ??
      (acte.parentUuid ? uuidToId.get(acte.parentUuid) : undefined);
    await upsertActeAdministratif(tx, acte, ownerData, resolvedParentId);
  }
};

const upsertActeAdministratif = (
  tx: PrismaTransaction,
  acteAdministratif: ActeAdministratifApiType,
  ownerData: { structureDnaCode: string | null; cpomId: number | null },
  parentId?: number
) => {
  return tx.acteAdministratif.upsert({
    where: { id: acteAdministratif.id || 0 },
    update: {
      ...ownerData,
      category: acteAdministratif.category,
      date: acteAdministratif.date,
      startDate: acteAdministratif.startDate,
      endDate: acteAdministratif.endDate,
      name: acteAdministratif.name,
      parentId: parentId ?? acteAdministratif.parentId,
      fileUploads: {
        connect: acteAdministratif.fileUploads,
      },
    },
    create: {
      ...ownerData,
      category: acteAdministratif.category,
      date: acteAdministratif.date,
      startDate: acteAdministratif.startDate,
      endDate: acteAdministratif.endDate,
      name: acteAdministratif.name,
      parentId: parentId ?? acteAdministratif.parentId,
      fileUploads: {
        connect: acteAdministratif.fileUploads,
      },
    },
  });
};
