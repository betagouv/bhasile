import { DomainError } from "@/app/utils/domain-error.util";
import { FileUpload } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { FileWithParents, fileWithParentsInclude } from "./file.db.type";

export const createOne = async ({
  key,
  mimeType,
  originalName,
  fileSize,
}: CreateOneArgs): Promise<FileUpload | null> => {
  return prisma.fileUpload.create({
    data: { key, mimeType, originalName, fileSize },
  });
};

type CreateOneArgs = {
  key: string;
  mimeType: string;
  originalName: string;
  fileSize: number;
};

export const findOneByKeyWithParents = async (
  key: string
): Promise<FileWithParents | null> => {
  return prisma.fileUpload.findUnique({
    where: { key },
    include: fileWithParentsInclude,
  });
};

export const assertFilesCanBeAttachedToEntity = async (
  tx: PrismaTransaction,
  fileUploads: { key: string }[],
  entityId: EntityId
): Promise<void> => {
  const files = await tx.fileUpload.findMany({
    where: { key: { in: fileUploads.map((fileUpload) => fileUpload.key) } },
    select: {
      key: true,
      operateurId: true,
      acteAdministratif: {
        select: {
          structureId: true,
          cpomId: true,
          operateurId: true,
          structureVersionTransformationId: true,
        },
      },
      documentFinancier: { select: { structureId: true, cpomId: true } },
      controle: { select: { structureId: true } },
      evaluation: { select: { structureId: true } },
    },
  });

  const foundKeys = new Set(files.map((file) => file.key));
  if (fileUploads.some((fileUpload) => !foundKeys.has(fileUpload.key))) {
    throw new DomainError("Fichier introuvable", 404);
  }

  const hasFileFromOtherEntity = files.some((file) => {
    const owners: FileOwner[] = [
      file.acteAdministratif,
      file.documentFinancier,
      file.controle,
      file.evaluation,
      file.operateurId === null ? null : { operateurId: file.operateurId },
    ].filter((owner) => owner !== null);
    return owners.some((owner) => !isOwnedByEntity(owner, entityId));
  });

  if (hasFileFromOtherEntity) {
    throw new DomainError(
      "Un fichier est déjà rattaché à une autre entité",
      409
    );
  }
};

type FileOwner = Partial<Record<keyof EntityId, number | null>>;

const isOwnedByEntity = (owner: FileOwner, entityId: EntityId): boolean => {
  const entityFields = (Object.keys(entityId) as (keyof EntityId)[]).filter(
    (field) => entityId[field] !== undefined
  );
  return (
    entityFields.length > 0 &&
    entityFields.every((field) => owner[field] === entityId[field])
  );
};

export const deleteOneByKey = async (
  key: string
): Promise<FileUpload | null> => {
  const file = await prisma.fileUpload.findFirst({
    where: {
      key,
    },
  });

  if (!file) {
    return null;
  }

  return prisma.fileUpload.delete({
    where: {
      id: Number(file.id),
    },
  });
};
