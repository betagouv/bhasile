import { DnaStructureTransformationApiType } from "@/schemas/api/transformation.schema";
import { PrismaTransaction } from "@/types/prisma.type";

export const createOrUpdateDnaStructureTransformations = async (
  tx: PrismaTransaction,
  dnas: Partial<DnaStructureTransformationApiType>[] | undefined,
  structureTransformationId: number
): Promise<void> => {
  if (!dnas) {
    return;
  }

  await tx.dnaStructureTransformation.deleteMany({
    where: { structureTransformationId },
  });

  if (dnas.length === 0) {
    return;
  }

  for (const dnaStructureTransformation of dnas) {
    const dna = dnaStructureTransformation.dna;
    if (!dna?.code) {
      continue;
    }

    const normalizedCode = dna.code.trim();
    if (!normalizedCode) {
      continue;
    }
    const upsertedDna = await tx.dna.upsert({
      where: { code: normalizedCode },
      update: { description: dna.description },
      create: {
        code: normalizedCode,
        description: dna.description,
      },
    });

    await tx.dnaStructureTransformation.create({
      data: {
        structureTransformationId,
        dnaId: upsertedDna.id,
      },
    });
  }
};
