import type { PrismaClient } from "@/generated/prisma/client";
import { FileUploadCategory } from "@/generated/prisma/client";
import { StructureType } from "@/types/structure-type.type";

import {
  createFakeFileUpload,
  createFakeFileUploadWithParent,
} from "./file-upload.seed";

export async function seedParentChildFileUploads(
  prisma: PrismaClient,
  structureDnaCode: string
) {
  const categories = Object.values(FileUploadCategory);

  const parentUploads = await Promise.all(
    categories.map(() =>
      prisma.fileUpload.create({
        data: {
          ...createFakeFileUpload({
            category: FileUploadCategory.AUTRE,
            cpom: false,
            structureType: StructureType.CADA,
          }),
          structureDnaCode,
        },
      })
    )
  );

  const childrenByParent = await Promise.all(
    parentUploads.map(async (parent) => {
      const childCount = Math.floor(Math.random() * 3);
      const children = await Promise.all(
        Array(childCount)
          .fill(null)
          .map(() =>
            prisma.fileUpload.create({
              data: {
                ...createFakeFileUploadWithParent({
                  parentFileUploadId: parent.id,
                }),
                structureDnaCode,
                category: parent.category,
              },
            })
          )
      );

      return children;
    })
  );

  const allChildren = childrenByParent.flat();

  return {
    parents: parentUploads,
    children: allChildren,
  };
}
