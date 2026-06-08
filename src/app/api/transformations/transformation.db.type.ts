import { AVENANT_PARENT_CATEGORIES } from "@/config/transformation.config";
import { Prisma } from "@/generated/prisma/client";

export const transformationInclude = {
  form: {
    include: {
      formDefinition: true,
      formSteps: {
        include: {
          stepDefinition: true,
        },
      },
    },
  },
  structureVersionTransformations: {
    orderBy: { id: "asc" },
    include: {
      operateur: { select: { id: true, name: true } },
      form: {
        include: {
          formDefinition: true,
          formSteps: {
            include: { stepDefinition: true },
          },
        },
      },
      actesAdministratifs: {
        include: { fileUploads: true },
      },
      structureVersion: {
        include: {
          structure: {
            include: {
              operateur: { select: { id: true, name: true } },
              actesAdministratifs: {
                where: {
                  parentId: null,
                  category: { in: AVENANT_PARENT_CATEGORIES },
                },
                select: {
                  id: true,
                  category: true,
                  startDate: true,
                  endDate: true,
                  children: { select: { endDate: true } },
                },
              },
              structureTypologies: {
                orderBy: { year: "desc" },
              },
            },
          },
          contacts: true,
          adresses: true,
          finesses: true,
          antennes: true,
          dnaStructures: {
            include: { dna: true },
          },
          structureTypologies: {
            orderBy: { year: "desc" },
          },
        },
      },
    },
  },
} satisfies Prisma.TransformationInclude;

export type TransformationDbDetails = Prisma.TransformationGetPayload<{
  include: typeof transformationInclude;
}>;
