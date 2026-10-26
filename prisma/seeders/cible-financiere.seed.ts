import { getYearRange } from "@/app/utils/date.util";
import { Prisma } from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";

const CIBLES_BY_TYPE: Record<
  StructureType,
  { tarif: number; tauxEncadrement: number }
> = {
  [StructureType.CADA]: { tarif: 21, tauxEncadrement: 15 },
  [StructureType.CPH]: { tarif: 27, tauxEncadrement: 10 },
  [StructureType.HUDA]: { tarif: 18, tauxEncadrement: 20 },
  [StructureType.CAES]: { tarif: 25, tauxEncadrement: 15 },
};

const IDF_TARIF_SUPPLEMENT = 2;
const CADA_FROM_HUDA_TAUX_ENCADREMENT = 18;

export const getFakeTarifsJournaliersCibles =
  (): Prisma.TarifJournalierCibleCreateManyInput[] =>
    getYearRange().years.flatMap((year) =>
      Object.values(StructureType).flatMap((structureType) =>
        [true, false].map((isIdf) => ({
          structure_type: structureType,
          year,
          belongs_to_idf: isIdf,
          tarif_cible:
            CIBLES_BY_TYPE[structureType].tarif +
            (isIdf ? IDF_TARIF_SUPPLEMENT : 0),
        }))
      )
    );

export const getFakeTauxEncadrementCibles =
  (): Prisma.TauxEncadrementCibleCreateManyInput[] =>
    getYearRange().years.flatMap((year) =>
      Object.values(StructureType).flatMap((structureType) =>
        [true, false].flatMap((isIdf) => [
          {
            structure_type: structureType,
            year,
            belongs_to_idf: isIdf,
            comes_from_huda: false,
            taux_cible: CIBLES_BY_TYPE[structureType].tauxEncadrement,
          },
          ...(structureType === StructureType.CADA
            ? [
                {
                  structure_type: structureType,
                  year,
                  belongs_to_idf: isIdf,
                  comes_from_huda: true,
                  taux_cible: CADA_FROM_HUDA_TAUX_ENCADREMENT,
                },
              ]
            : []),
        ])
      )
    );
