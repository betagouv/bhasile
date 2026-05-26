import { Prisma } from "@/generated/prisma/client";

export type TransformationDb = Prisma.TransformationGetPayload<{
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
            structure: {
              include: {
                operateur: { select: { id: true; name: true } };
              };
            };
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
