import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { PrismaTransaction } from "@/types/prisma.type";
import { PartialExcept } from "@/types/utils.type";

export const createOrUpdateStructureTypologies = async (
  tx: PrismaTransaction,
  structureTypologies:
    | PartialExcept<StructureTypologieApiType, "year">[]
    | undefined,
  structureDnaCode: string
): Promise<void> => {
  if (!structureTypologies || structureTypologies.length === 0) {
    return;
  }

  await Promise.all(
    (structureTypologies || []).map((typologie) => {
      return tx.structureTypologie.upsert({
        where: { id: typologie.id || 0 },
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
          structureDnaCode,
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
