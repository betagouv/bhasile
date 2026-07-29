import prisma from "@/lib/prisma";
import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

const deleteAdresses = async (
  tx: PrismaTransaction,
  adressesToKeep: Partial<AdresseApiType>[],
  entityId: EntityId
): Promise<void> => {
  const everyAdressesOfEntity = await tx.adresse.findMany({
    where: entityId,
  });
  const adressesToDelete = everyAdressesOfEntity.filter(
    (adresse) => !adressesToKeep.some((a) => a.id === adresse.id)
  );
  await Promise.all(
    adressesToDelete.map((adresse) =>
      tx.adresse.delete({ where: { id: adresse.id } })
    )
  );
};

export const createOrUpdateAdresses = async (
  tx: PrismaTransaction,
  adresses: Partial<AdresseApiType>[] = [],
  entityId: EntityId
): Promise<void> => {
  if (!adresses || adresses.length === 0) {
    return;
  }

  // Delete adresses that are not in the provided array
  await deleteAdresses(tx, adresses, entityId);

  for (const adresse of adresses) {
    await tx.adresse.upsert({
      where: { id: adresse.id || 0 },
      update: {
        adresse: adresse.adresse,
        codePostal: adresse.codePostal,
        commune: adresse.commune,
        repartition: adresse.repartition,
        placesAutorisees: adresse.placesAutorisees,
        isQpv: adresse.isQpv,
        isLogementSocial: adresse.isLogementSocial,
      },
      create: {
        ...entityId,
        adresse: adresse.adresse,
        codePostal: adresse.codePostal,
        commune: adresse.commune,
        repartition: adresse.repartition,
        placesAutorisees: adresse.placesAutorisees,
        isQpv: adresse.isQpv,
        isLogementSocial: adresse.isLogementSocial,
      },
    });
  }
};

export const checkAdressesExistence = async (
  structureId: number
): Promise<boolean> => {
  const adresses = await prisma.adresse.findMany({
    where: { structureId: structureId },
  });
  return adresses.length > 0;
};
