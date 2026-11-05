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

export const findOneByKeyWithParents = async (
  key: string
): Promise<FileWithParents | null> => {
  return prisma.fileUpload.findUnique({
    where: { key },
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
