import { AntenneApiType } from "@/schemas/api/antenne.schema";
import { PrismaTransaction } from "@/types/prisma.type";

const deleteAntennes = async (
  tx: PrismaTransaction,
  antennesToKeep: Partial<AntenneApiType>[],
  structureId: number
): Promise<void> => {
  const everyAntennesOfStructure = await tx.antenne.findMany({
    where: { structureId: structureId },
  });
  const antennesToDelete = everyAntennesOfStructure.filter(
    (antenne) => !antennesToKeep.some((a) => a.id === antenne.id)
  );
  await Promise.all(
    antennesToDelete.map((antenne) =>
      tx.antenne.delete({ where: { id: antenne.id } })
    )
  );
};

export const createOrUpdateAntennes = async (
  tx: PrismaTransaction,
  antennes: Partial<AntenneApiType>[] = [],
  structureId: number
): Promise<void> => {
  if (!antennes) {
    return;
  }

  await deleteAntennes(tx, antennes, structureId);

  if (antennes.length === 0) {
    return;
  }

  // Delete antennes that are not in the provided array
  await deleteAntennes(tx, antennes, structureId);

  for (const antenne of antennes) {
    await tx.antenne.upsert({
      where: { id: antenne.id || 0 },
      update: {
        name: antenne.name,
        adresse: antenne.adresse,
        codePostal: antenne.codePostal,
        commune: antenne.commune,
        departement: antenne.departement,
      },
      create: {
        structureId: structureId,
        name: antenne.name,
        adresse: antenne.adresse,
        codePostal: antenne.codePostal,
        commune: antenne.commune,
        departement: antenne.departement,
      },
    });
  }
};
