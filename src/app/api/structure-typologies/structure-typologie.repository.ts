import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";
import { PartialExcept } from "@/types/utils.type";

const getUniqueWhere = (
  entityId: EntityId,
  year: number
):
  | { structureId_year: { structureId: number; year: number } }
  | {
      structureTransformationId_year: {
        structureTransformationId: number;
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
  if (entityId.structureTransformationId !== undefined) {
    return {
      structureTransformationId_year: {
        structureTransformationId: entityId.structureTransformationId,
        year,
      },
    };
  }
  throw new Error(
    "structureId ou structureTransformationId est requis pour une structureTypologie"
  );
};

export const createOrUpdateStructureTypologies = async (
  tx: PrismaTransaction,
  structureTypologies:
    | PartialExcept<StructureTypologieApiType, "year">[]
    | undefined,
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
            placesAutorisees: typologie.placesAutorisees,
          }),
          ...(typologie.pmr !== undefined && { pmr: typologie.pmr }),
          ...(typologie.lgbt !== undefined && { lgbt: typologie.lgbt }),
          ...(typologie.fvvTeh !== undefined && { fvvTeh: typologie.fvvTeh }),
          ...(typologie.placesACreer !== undefined && {
            placesACreer: typologie.placesACreer,
          }),
          ...(typologie.placesAFermer !== undefined && {
            placesAFermer: typologie.placesAFermer,
          }),
          ...(typologie.echeancePlacesACreer !== undefined && {
            echeancePlacesACreer: typologie.echeancePlacesACreer,
          }),
          ...(typologie.echeancePlacesAFermer !== undefined && {
            echeancePlacesAFermer: typologie.echeancePlacesAFermer,
          }),
        },
        create: {
          ...entityId,
          year: typologie.year!,
          placesAutorisees: typologie.placesAutorisees,
          pmr: typologie.pmr,
          lgbt: typologie.lgbt,
          fvvTeh: typologie.fvvTeh,
          placesACreer: typologie.placesACreer,
          placesAFermer: typologie.placesAFermer,
          echeancePlacesACreer: typologie.echeancePlacesACreer,
          echeancePlacesAFermer: typologie.echeancePlacesAFermer,
        },
      });
    })
  );
};
