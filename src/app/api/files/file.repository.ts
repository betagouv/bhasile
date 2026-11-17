import { DomainError } from "@/app/utils/domain-error.util";
import { FileUpload } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import type { PrismaTransaction } from "@/types/prisma.type";

import {
  FileWithParents,
  fileWithParentsInclude,
  unattachedFileWhere,
} from "./file.db.type";

export const createOne = async ({
  key,
  mimeType,
  originalName,
  fileSize,
  sha256,
}: CreateOneArgs): Promise<FileUpload | null> => {
  return prisma.fileUpload.create({
    data: { key, mimeType, originalName, fileSize, sha256 },
  });
};

type CreateOneArgs = {
  key: string;
  mimeType: string;
  originalName: string;
  fileSize: number;
  sha256: string;
};

// Les fichiers de la tarification, de ses copies et des messages font preuve : aucun formulaire ne les rattache
export const assertFilesCanBeAttached = async (
  tx: PrismaTransaction,
  keys: string[]
): Promise<void> => {
  const proofFile = await tx.fileUpload.findFirst({
    where: {
      key: { in: keys },
      OR: [
        { tarificationDocument: { isNot: null } },
        { messageId: { not: null } },
        { documentFinancier: { sourceTarificationDocumentId: { not: null } } },
        { acteAdministratif: { sourceTarificationDocumentId: { not: null } } },
      ],
    },
    select: { id: true },
  });
  if (proofFile) {
    throw new DomainError(
      "Ce fichier ne peut pas être rattaché à ce formulaire",
      422
    );
  }
};

export const findOneByKeyWithParents = async (
  key: string
): Promise<FileWithParents | null> => {
  return prisma.fileUpload.findUnique({
    where: { key },
    include: fileWithParentsInclude,
  });
};

export const findManyByKeysWithParents = async (
  tx: PrismaTransaction,
  keys: string[]
): Promise<FileWithParents[]> => {
  return tx.fileUpload.findMany({
    where: { key: { in: keys } },
    include: fileWithParentsInclude,
  });
};

export const findUnattachedFileUpload = (
  tx: PrismaTransaction,
  key: string
): Promise<{ id: number } | null> =>
  tx.fileUpload.findFirst({
    where: { key, ...unattachedFileWhere },
    select: { id: true },
  });

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
