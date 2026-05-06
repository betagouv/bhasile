import { DnaStructureTransformationApiType } from "@/schemas/api/transformation.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { upsertDna } from "../dna-codes/dna-codes.repository";

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
    const upsertedDna = await upsertDna(tx, dnaStructureTransformation.dna);
    if (!upsertedDna) {
      continue;
    }

    await tx.dnaStructureTransformation.create({
      data: {
        structureTransformationId,
        dnaId: upsertedDna.id,
      },
    });
  }
};
