import { E2E_PREFIX } from "../data/ids";
import { deleteTransformationGraph } from "./cleanup";
import { prisma } from "./prisma";

export const cleanupOrphans = async (): Promise<void> => {
  const errors: string[] = [];

  const e2eStructureVersionTransformations =
    await prisma.structureVersionTransformation.findMany({
      where: {
        OR: [
          {
            structureVersion: {
              structure: { codeBhasile: { startsWith: E2E_PREFIX } },
            },
          },
          { structureVersion: { nom: { startsWith: E2E_PREFIX } } },
        ],
      },
      select: { transformationId: true },
    });
  const transformationIds = [
    ...new Set(
      e2eStructureVersionTransformations.map(
        (structureVersionTransformation) =>
          structureVersionTransformation.transformationId
      )
    ),
  ];
  for (const transformationId of transformationIds) {
    try {
      await deleteTransformationGraph(transformationId);
    } catch (err) {
      errors.push(
        `transformation ${transformationId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const cpoms = await prisma.cpom.findMany({
    where: { name: { startsWith: E2E_PREFIX } },
    select: { id: true },
  });
  for (const { id } of cpoms) {
    try {
      await prisma.userAction.deleteMany({ where: { cpomId: id } });
      await prisma.cpomMillesime.deleteMany({ where: { cpomId: id } });
      await prisma.cpom.deleteMany({ where: { id } });
    } catch (err) {
      errors.push(
        `cpom ${id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      structureVersion: {
        structure: { codeBhasile: { startsWith: E2E_PREFIX } },
      },
    },
    select: { id: true },
  });
  for (const { id } of campaigns) {
    try {
      await prisma.campaign.delete({ where: { id } });
    } catch (err) {
      errors.push(
        `campaign ${id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const structures = await prisma.structure.findMany({
    where: { codeBhasile: { startsWith: E2E_PREFIX } },
    select: { id: true, codeBhasile: true },
  });
  for (const { id, codeBhasile } of structures) {
    try {
      await prisma.userAction.deleteMany({ where: { structureId: id } });
      await prisma.cpomStructure.deleteMany({ where: { structureId: id } });
      await prisma.structure.deleteMany({ where: { id } });
    } catch (err) {
      errors.push(
        `structure ${codeBhasile}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  try {
    await prisma.dna.deleteMany({
      where: { code: { startsWith: E2E_PREFIX } },
    });
  } catch (err) {
    errors.push(
      `dna prefix: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  try {
    await prisma.finess.deleteMany({
      where: { code: { startsWith: E2E_PREFIX } },
    });
  } catch (err) {
    errors.push(
      `finess prefix: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `cleanupOrphans left ${errors.length} record(s) behind:\n  - ${errors.join("\n  - ")}`
    );
  }
};
