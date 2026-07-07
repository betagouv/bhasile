import { StructureVersionTransformationType } from "@/types/transformation.type";

import { prisma } from "./prisma";

/**
 * Supprime tout le graphe d'une transformation (Prisma direct, car une
 * transformation finalisée n'est pas supprimable via l'API).
 *
 * Ordre explicite (SVT puis Transformation) → correct que le FK
 * StructureVersionTransformation → Transformation soit RESTRICT ou CASCADE.
 * Supprimer les SVT cascade leurs StructureVersion (+ contacts/antennes/
 * adresses/dna/finess/typologies), leurs Form et leurs actes. Les coquilles
 * `Structure` créées par les blocs CREATION ne sont jamais cascadées → on les
 * collecte avant et on les supprime à la fin.
 */
export const deleteTransformationGraph = async (
  transformationId: number
): Promise<void> => {
  const transformation = await prisma.transformation.findUnique({
    where: { id: transformationId },
    select: {
      structureVersionTransformations: {
        select: {
          type: true,
          structureVersion: { select: { structureId: true } },
        },
      },
    },
  });
  if (!transformation) {
    return;
  }

  const createdStructureIds = transformation.structureVersionTransformations
    .filter(
      (structureVersionTransformation) =>
        structureVersionTransformation.type ===
        StructureVersionTransformationType.CREATION
    )
    .map(
      (structureVersionTransformation) =>
        structureVersionTransformation.structureVersion?.structureId
    )
    .filter((structureId): structureId is number => structureId != null);

  await prisma.$transaction([
    prisma.structureVersionTransformation.deleteMany({
      where: { transformationId },
    }),
    prisma.transformation.delete({ where: { id: transformationId } }),
    ...(createdStructureIds.length > 0
      ? [prisma.structure.deleteMany({ where: { id: { in: createdStructureIds } } })]
      : []),
  ]);
};

export const deleteStructureByCode = async (
  codeBhasile: string
): Promise<void> => {
  await prisma.$transaction([
    prisma.userAction.deleteMany({ where: { structure: { codeBhasile } } }),
    prisma.cpomStructure.deleteMany({ where: { structure: { codeBhasile } } }),
    prisma.structure.deleteMany({ where: { codeBhasile } }),
  ]);
};

export const deleteCpomById = async (id: number): Promise<void> => {
  await prisma.$transaction([
    prisma.userAction.deleteMany({ where: { cpomId: id } }),
    prisma.cpomMillesime.deleteMany({ where: { cpomId: id } }),
    prisma.cpom.deleteMany({ where: { id } }),
  ]);
};
