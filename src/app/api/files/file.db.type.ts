import { Prisma } from "@/generated/prisma/client";

export const fileWithParentsInclude = {
  acteAdministratif: {
    include: {
      structure: true,
      cpom: {
        include: {
          structures: { select: { structureId: true } },
          departements: {
            select: { departement: { select: { numero: true } } },
          },
        },
      },
      operateur: true,
    },
  },
  documentFinancier: { include: { structure: true } },
  controle: { include: { structure: true } },
  evaluation: { include: { structure: true } },
  operateur: true,
} satisfies Prisma.FileUploadInclude;

export type FileWithParents = Prisma.FileUploadGetPayload<{
  include: typeof fileWithParentsInclude;
}>;
