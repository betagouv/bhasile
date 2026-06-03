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
        operateur: { select: { id: true; name: true } };
        forms: {
          include: {
            formDefinition: true;
            formSteps: {
              include: { stepDefinition: true };
            };
          };
        };
        actesAdministratifs: {
          include: { fileUploads: true };
        };
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
