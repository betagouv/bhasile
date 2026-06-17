import { prisma } from "./prisma";

/** Charge le graphe complet d'une transformation pour les assertions DB. */
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
              finesses: true,
              dnaStructures: { include: { dna: true } },
              adresses: { include: { adresseTypologies: true } },
              structureTypologies: true,
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
