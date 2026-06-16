import { AntenneApiType } from "@/schemas/api/antenne.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

const deleteAntennes = async (
  tx: PrismaTransaction,
  antennesToKeep: Partial<AntenneApiType>[],
  entityId: EntityId
): Promise<void> => {
  const everyAntennesOfEntity = await tx.antenne.findMany({
    where: entityId,
  });
  const antennesToDelete = everyAntennesOfEntity.filter(
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
  antennes: Partial<AntenneApiType>[] | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!antennes) {
    return;
  }

  await deleteAntennes(tx, antennes, entityId);

  if (antennes.length === 0) {
    return;
  }

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
        ...entityId,
        name: antenne.name,
        adresse: antenne.adresse,
        codePostal: antenne.codePostal,
        commune: antenne.commune,
        departement: antenne.departement,
      },
    });
  }
};
