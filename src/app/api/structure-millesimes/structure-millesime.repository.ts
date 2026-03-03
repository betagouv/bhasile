import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { PrismaTransaction } from "@/types/prisma.type";

export const createOrUpdateStructureMillesimes = async (
  tx: PrismaTransaction,
  structureMillesimes: StructureMillesimeApiType[] | undefined,
  structureId: number
): Promise<void> => {
  if (!structureMillesimes || structureMillesimes.length === 0) {
    return;
  }

  await Promise.all(
    structureMillesimes.map((millesime) =>
      tx.structureMillesime.upsert({
        where: {
          structureId_year: {
            structureId,
            year: millesime.year,
          },
        },
        update: millesime,
        create: {
          structureId,
          ...millesime,
        },
      })
    )
  );
};
