import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";
import { PartialExcept } from "@/types/utils.type";

import { resolveWritablePlacesForYear } from "./structure-typologie.util";

const getUniqueWhere = (
  entityId: EntityId,
  year: number
):
  | { structureId_year: { structureId: number; year: number } }
  | {
      structureVersionTransformationId_year: {
        structureVersionTransformationId: number;
        year: number;
      };
    } => {
  if (entityId.structureId !== undefined) {
    return {
      structureId_year: {
        structureId: entityId.structureId,
        year,
      },
    };
  }
  if (entityId.structureVersionTransformationId !== undefined) {
    return {
      structureVersionTransformationId_year: {
        structureVersionTransformationId:
          entityId.structureVersionTransformationId,
        year,
      },
    };
  }
  throw new Error(
    "structureId ou structureVersionTransformationId est requis pour une structureTypologie"
  );
};

export const createOrUpdateStructureTypologies = async (
  tx: PrismaTransaction,
  structureTypologies:
    PartialExcept<StructureTypologieApiType, "year">[] | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!structureTypologies || structureTypologies.length === 0) {
    return;
  }

  await Promise.all(
    (structureTypologies || []).map((typologie) => {
      return tx.structureTypologie.upsert({
        where: getUniqueWhere(entityId, typologie.year!),
        update: {
          ...(typologie.year !== undefined && { year: typologie.year }),
          ...(typologie.placesAutorisees !== undefined && {
            placesAutorisees: resolveWritablePlacesForYear(
              typologie.year!,
              typologie.placesAutorisees
            ),
          }),
          ...(typologie.pmr !== undefined && { pmr: typologie.pmr }),
          ...(typologie.lgbt !== undefined && { lgbt: typologie.lgbt }),
          ...(typologie.fvvTeh !== undefined && { fvvTeh: typologie.fvvTeh }),
        },
        create: {
          ...entityId,
          year: typologie.year!,
          placesAutorisees: resolveWritablePlacesForYear(
            typologie.year!,
            typologie.placesAutorisees
          ),
          pmr: typologie.pmr,
          lgbt: typologie.lgbt,
          fvvTeh: typologie.fvvTeh,
        },
      });
    })
  );
};
