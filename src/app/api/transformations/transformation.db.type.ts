import { AVENANT_PARENT_CATEGORIES } from "@/config/transformation.config";
import { Prisma } from "@/generated/prisma/client";

import { structureVersionDetailsInclude } from "../structure-versions/structure-version.db.type";

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
      structureTypologies: {
        orderBy: { year: "desc" },
      },
      structureVersion: {
        include: {
          structure: {
            include: {
              operateur: { select: { id: true, name: true } },
              antennes: true,
              actesAdministratifs: {
                where: {
                  parentId: null,
                  category: { in: AVENANT_PARENT_CATEGORIES },
                },
                orderBy: { startDate: "desc" },
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
              structureVersions: {
                include: structureVersionDetailsInclude,
              },
            },
          },
          contacts: true,
          adresses: {
            include: {
              adresseTypologies: {
                orderBy: { year: "desc" },
              },
            },
          },
          structureFinesses: {
            include: { finess: true },
          },
          antennes: true,
          dnaStructures: {
            include: { dna: true },
          },
        },
      },
    },
  },
} satisfies Prisma.TransformationInclude;

export type TransformationDbDetails = Prisma.TransformationGetPayload<{
  include: typeof transformationInclude;
}>;
