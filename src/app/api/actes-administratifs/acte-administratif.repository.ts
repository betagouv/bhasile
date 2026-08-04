import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { getKeysFromIncomingDocumentsOrActes } from "../files/file.service";

export const createOrUpdateActesAdministratifs = async (
  tx: PrismaTransaction,
  actesAdministratifs: ActeAdministratifApiType[] | undefined,
  entityId: EntityId,
  options: { skipOrphanDelete?: boolean } = {}
): Promise<void> => {
  if (!actesAdministratifs || actesAdministratifs.length === 0) {
    return;
  }

  const deletedIds = options.skipOrphanDelete
    ? new Set<number>()
    : new Set(
        await deleteActesAdministratifs(tx, actesAdministratifs, entityId)
      );

  const { parents, avenants } =
    partitionParentsAndAvenants(actesAdministratifs);

  const parentIdsByUuid = await createOrUpdateParents(tx, parents, entityId);

  await createOrUpdateAvenants(
    tx,
    avenants,
    entityId,
    parentIdsByUuid,
    deletedIds
  );
};

const partitionParentsAndAvenants = (
  actesAdministratifs: ActeAdministratifApiType[]
): {
  parents: ActeAdministratifApiType[];
  avenants: ActeAdministratifApiType[];
} => {
  const parents: ActeAdministratifApiType[] = [];
  const avenants: ActeAdministratifApiType[] = [];
  for (const acteAdministratif of actesAdministratifs) {
    if (acteAdministratif.parentId || acteAdministratif.parentUuid) {
      avenants.push(acteAdministratif);
    } else {
      parents.push(acteAdministratif);
    }
  }
  return { parents, avenants };
};

const createOrUpdateParents = async (
  tx: PrismaTransaction,
  parents: ActeAdministratifApiType[],
  entityId: EntityId
): Promise<Map<string, number>> => {
  const parentIdsByUuid = new Map<string, number>();
  for (const parent of parents) {
    const created = await createOrUpdateActeAdministratif(tx, parent, entityId);
    if (parent.uuid) {
      parentIdsByUuid.set(parent.uuid, created.id);
    }
  }
  return parentIdsByUuid;
};

const createOrUpdateAvenants = async (
  tx: PrismaTransaction,
  avenants: ActeAdministratifApiType[],
  entityId: EntityId,
  parentIdsByUuid: Map<string, number>,
  deletedIds: Set<number>
): Promise<void> => {
  for (const avenant of avenants) {
    const resolvedParentId = resolveParentId(avenant, parentIdsByUuid);
    if (
      hasUnresolvedParentUuid(avenant, resolvedParentId) ||
      parentWasDeleted(resolvedParentId, deletedIds)
    ) {
      continue;
    }
    const parentId = (await parentNoLongerExists(tx, avenant))
      ? undefined
      : resolvedParentId;
    await createOrUpdateActeAdministratif(tx, avenant, entityId, parentId);
  }
};

const resolveParentId = (
  avenant: ActeAdministratifApiType,
  parentIdsByUuid: Map<string, number>
): number | undefined =>
  avenant.parentId ??
  (avenant.parentUuid ? parentIdsByUuid.get(avenant.parentUuid) : undefined);

const hasUnresolvedParentUuid = (
  avenant: ActeAdministratifApiType,
  parentId: number | undefined
): boolean => !parentId && !!avenant.parentUuid;

const parentWasDeleted = (
  parentId: number | undefined,
  deletedIds: Set<number>
): boolean => parentId !== undefined && deletedIds.has(parentId);

const parentNoLongerExists = async (
  tx: PrismaTransaction,
  avenant: ActeAdministratifApiType
): Promise<boolean> =>
  avenant.parentId !== undefined &&
  !(await checkActeAdministratifExistence(tx, avenant.parentId));

const checkActeAdministratifExistence = async (
  tx: PrismaTransaction,
  id: number
): Promise<boolean> => {
  const existing = await tx.acteAdministratif.findUnique({
    where: { id },
    select: { id: true },
  });
  return existing !== null;
};

const createOrUpdateActeAdministratif = async (
  tx: PrismaTransaction,
  acteAdministratif: ActeAdministratifApiType,
  entityId: EntityId,
  parentId?: number
) => {
  const realParentId = parentId ?? null;

  const fileUploadKeys = (acteAdministratif.fileUploads ?? [])
    .map((fileUpload) => fileUpload?.key)
    .filter((key): key is string => Boolean(key));

  const scalarData = {
    ...entityId,
    category: acteAdministratif.category,
    structureType: acteAdministratif.structureType,
    date: acteAdministratif.date,
    startDate: acteAdministratif.startDate,
    endDate: acteAdministratif.endDate,
    name: acteAdministratif.name,
    parentId: realParentId,
  };

  if (acteAdministratif.id !== undefined) {
    const ownedActe = await tx.acteAdministratif.findFirst({
      where: { id: acteAdministratif.id, ...entityId },
      select: { id: true },
    });
    if (ownedActe) {
      return tx.acteAdministratif.update({
        where: { id: ownedActe.id },
        data: {
          ...scalarData,
          fileUploads: {
            deleteMany:
              fileUploadKeys.length > 0
                ? { key: { notIn: fileUploadKeys } }
                : {},
            connect: fileUploadKeys.map((key) => ({ key })),
          },
        },
      });
    }
  }

  const fileKey = fileUploadKeys[0];
  if (!fileKey) {
    return tx.acteAdministratif.create({ data: scalarData });
  }

  const existingFileUpload = await tx.fileUpload.findUnique({
    where: { key: fileKey },
    select: { acteAdministratifId: true },
  });
  if (existingFileUpload?.acteAdministratifId) {
    return tx.acteAdministratif.update({
      where: { id: existingFileUpload.acteAdministratifId },
      data: {
        ...scalarData,
        fileUploads: {
          connect: fileUploadKeys.map((key) => ({ key })),
        },
      },
    });
  }

  return tx.acteAdministratif.create({
    data: {
      ...scalarData,
      fileUploads: {
        connect: fileUploadKeys.map((key) => ({ key })),
      },
    },
  });
};

const deleteActesAdministratifs = async (
  tx: PrismaTransaction,
  actesAdministratifsToKeep: ActeAdministratifApiType[],
  entityId: EntityId
): Promise<number[]> => {
  let where:
    | { structureId: number }
    | { cpomId: number }
    | { operateurId: number }
    | { structureVersionTransformationId: number };
  if (entityId.structureId !== undefined) {
    where = { structureId: entityId.structureId };
  } else if (entityId.cpomId !== undefined) {
    where = { cpomId: entityId.cpomId };
  } else if (entityId.operateurId !== undefined) {
    where = { operateurId: entityId.operateurId };
  } else if (entityId.structureVersionTransformationId !== undefined) {
    where = {
      structureVersionTransformationId:
        entityId.structureVersionTransformationId,
    };
  } else {
    return [];
  }

  const fileKeysToKeep = getKeysFromIncomingDocumentsOrActes(
    actesAdministratifsToKeep
  );

  const acteIdsToKeep = new Set(
    actesAdministratifsToKeep
      .map((acteAdministratif) => acteAdministratif.id)
      .filter((id): id is number => id !== undefined)
  );

  const allActesAdministratifs = await tx.acteAdministratif.findMany({
    where,
    include: { fileUploads: true },
  });

  const actesAdministratifsToDelete = allActesAdministratifs.filter(
    (acteAdministratif) => {
      if (acteIdsToKeep.has(acteAdministratif.id)) {
        return false;
      }
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
