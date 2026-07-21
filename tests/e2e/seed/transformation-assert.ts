import { prisma } from "./prisma";

export const fetchTransformationGraph = async (transformationId: number) => {
  return prisma.transformation.findUniqueOrThrow({
    where: { id: transformationId },
    include: {
      form: { include: { formSteps: { include: { stepDefinition: true } } } },
      structureVersionTransformations: {
        include: {
          form: { include: { formSteps: true } },
          actesAdministratifs: { include: { fileUploads: true } },
          structureVersion: {
            include: {
              structure: true,
              contacts: true,
              antennes: true,
              structureFinesses: { include: { finess: true } },
              dnaStructures: { include: { dna: true } },
              adresses: { include: { adresseTypologies: true } },
            },
          },
        },
      },
    },
  });
};

export type TransformationGraph = Awaited<
  ReturnType<typeof fetchTransformationGraph>
>;
