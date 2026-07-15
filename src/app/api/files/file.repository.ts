import { FileUpload } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

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
