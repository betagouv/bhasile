import { Prisma } from "@/generated/prisma/client";

export const unattachedFileWhere = {
  acteAdministratifId: null,
  documentFinancierId: null,
  controleId: null,
  evaluationId: null,
  operateurId: null,
  messageId: null,
  tarificationDocument: null,
} satisfies Prisma.FileUploadWhereInput;

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
  tarificationDocument: {
    select: {
      id: true,
      structureTarification: {
        select: { structureId: true, campaign: { select: { year: true } } },
      },
    },
  },
  message: {
    select: {
      conversation: {
        select: {
          visibility: true,
          structureTarification: {
            select: {
              structure: {
                select: {
                  id: true,
                  departementAdministratif: true,
                  operateurId: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.FileUploadInclude;

export type FileWithParents = Prisma.FileUploadGetPayload<{
  include: typeof fileWithParentsInclude;
}>;
