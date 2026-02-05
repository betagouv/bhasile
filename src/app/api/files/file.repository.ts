import * as Sentry from "@sentry/nextjs";

import { FileUpload, FileUploadCategory } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import {
  ActeAdministratifCategory,
  DocumentFinancierCategory,
} from "@/types/file-upload.type";
import { PrismaTransaction } from "@/types/prisma.type";

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

export const findOneByKey = async (key: string): Promise<FileUpload | null> => {
  return prisma.fileUpload.findFirst({
    where: {
      key,
    },
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

type FileUploadParentId =
  | { structureDnaCode: string; cpomId?: never }
  | { structureDnaCode?: never; cpomId: number };

const deleteFileUploads = async (
  tx: PrismaTransaction,
  fileUploadsToKeep: Partial<
    ActeAdministratifApiType | DocumentFinancierApiType
  >[],
  parentId: FileUploadParentId,
  category: "acteAdministratif" | "documentFinancier"
): Promise<void> => {
  const whereClause =
    "structureDnaCode" in parentId
      ? { structureDnaCode: parentId.structureDnaCode }
      : { cpomId: parentId.cpomId };

  const allFileUploads = await tx.fileUpload.findMany({
    where: whereClause,
  });

  const fileUploadsToDelete = allFileUploads.filter((fileUpload) => {
    if (!fileUpload.category) {
      return false;
    }

    const isAllowedCategory =
      category === "acteAdministratif"
        ? ActeAdministratifCategory.includes(
            fileUpload.category as (typeof ActeAdministratifCategory)[number]
          )
        : DocumentFinancierCategory.includes(
            fileUpload.category as (typeof DocumentFinancierCategory)[number]
          );

    if (!isAllowedCategory) {
      return false;
    }

    return !fileUploadsToKeep.some(
      (fileUploadToKeep) => fileUploadToKeep.key === fileUpload.key
    );
  });

  await Promise.all(
    fileUploadsToDelete.map((fileUpload) =>
      tx.fileUpload.delete({ where: { id: fileUpload.id } })
    )
  );
};

export const updateFileUploads = async (
  tx: PrismaTransaction,
  fileUploads:
    | Partial<ActeAdministratifApiType | DocumentFinancierApiType>[]
    | undefined,
  parentId: FileUploadParentId,
  category: "acteAdministratif" | "documentFinancier"
): Promise<void> => {
  if (!fileUploads || fileUploads.length === 0) {
    return;
  }

  await deleteFileUploads(tx, fileUploads, parentId, category);

  const parentData =
    "structureDnaCode" in parentId
      ? { structureDnaCode: parentId.structureDnaCode, cpomId: null }
      : { structureDnaCode: null, cpomId: parentId.cpomId };

  const parentLabel =
    "structureDnaCode" in parentId
      ? `structure "${parentId.structureDnaCode}"`
      : `cpom "${parentId.cpomId}"`;

  await Promise.all(
    (fileUploads || []).map(async (fileUpload) => {
      if (!fileUpload.key) {
        return;
      }

      const existingFileUpload = await tx.fileUpload.findUnique({
        where: { key: fileUpload.key },
      });

      if (!existingFileUpload) {
        const message = `FileUpload with key "${fileUpload.key}" not found for ${parentLabel} (category: ${category})`;
        console.warn(message);
        Sentry.captureMessage(message, {
          level: "warning",
          tags: {
            component: "file.repository",
            function: "updateFileUploads",
          },
          extra: {
            key: fileUpload.key,
            parentId,
            category,
          },
        });
        return;
      }

      await tx.fileUpload.update({
        where: { key: fileUpload.key },
        data: {
          date: fileUpload.date,
          category: (fileUpload.category as FileUploadCategory) || null,
          startDate: fileUpload.startDate,
          endDate: fileUpload.endDate,
          categoryName: fileUpload.categoryName,
          ...parentData,
          parentFileUploadId: fileUpload.parentFileUploadId,
          controleId: fileUpload.controleId,
          evaluationId: fileUpload.evaluationId,
        },
      });
    })
  );
};
