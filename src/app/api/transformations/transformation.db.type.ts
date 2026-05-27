import { Prisma } from "@/generated/prisma/client";

export type TransformationDbDetails = Prisma.TransformationGetPayload<{
  include: {
    form: {
      include: {
        formDefinition: true;
        formSteps: {
          include: { stepDefinition: true };
        };
      };
    };
    structureTransformations: {
      include: {
        structureVersion: {
          include: {
            structure: true;
            contacts: true;
            adresses: true;
            finesses: true;
            antennes: true;
            dnaStructures: {
              include: { dna: true };
            };
            structureTypologies: {
              orderBy: { year: "desc" };
            };
          };
        };
      };
    };
  };
}>;
