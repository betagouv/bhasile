import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

export const createOrUpdateIndicateursFinanciers = async (
  tx: PrismaTransaction,
  indicateursFinanciers: IndicateurFinancierApiType[] | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!indicateursFinanciers || indicateursFinanciers?.length === 0) {
    return;
  }

  await Promise.all(
    indicateursFinanciers.map((indicateurFinancier) => {
      return tx.indicateurFinancier.upsert({
        where: getWhere(entityId, indicateurFinancier),
        update: indicateurFinancier,
        create: {
          ...entityId,
          ...indicateurFinancier,
        },
      });
    })
  );
};

const getWhere = (
  entityId: EntityId,
  indicateurFinancier: IndicateurFinancierApiType
) => {
  if (entityId.structureId !== undefined) {
    return {
      structureId_year_type: {
        structureId: entityId.structureId,
        year: indicateurFinancier.year,
        type: indicateurFinancier.type,
      },
    };
  }
  throw new Error(
    "structureId est requis lors de la création d'un indicateur financier"
  );
};
