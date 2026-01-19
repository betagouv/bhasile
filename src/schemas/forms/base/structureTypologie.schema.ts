import z from "zod";

import { getStructureTypologyIndexForAYear } from "@/app/utils/structure.util";
import { nullishFrenchDateToISO, zSafeYear } from "@/app/utils/zodCustomFields";
import { zSafeDecimals } from "@/app/utils/zodSafeDecimals";
import { CURRENT_YEAR } from "@/constants";

export const structureTypologieWithoutEvolutionSchema = z.object({
  id: z.number().optional(),
  placesAutorisees: zSafeDecimals(),
  pmr: zSafeDecimals(),
  lgbt: zSafeDecimals(),
  fvvTeh: zSafeDecimals(),
  year: zSafeYear(),
});

export const placesEvolutionSchema = z.object({
  placesACreer: zSafeDecimals().nullish(),
  placesAFermer: zSafeDecimals().nullish(),
  echeancePlacesACreer: nullishFrenchDateToISO(),
  echeancePlacesAFermer: nullishFrenchDateToISO(),
});

export const structureTypologieSchema =
  structureTypologieWithoutEvolutionSchema.and(placesEvolutionSchema);

export const structureTypologiesSchema = z.object({
  structureTypologies: z.array(structureTypologieSchema),
});

export const structureTypologiesAutoSaveSchema = z.object({
  structureTypologies: z.array(
    structureTypologieWithoutEvolutionSchema
      .partial()
      .extend({ year: zSafeYear() })
      .and(placesEvolutionSchema.partial())
  ),
});

export const structureTypologiesWithMandatoryEvolutionSchema =
  structureTypologiesSchema.superRefine((data, ctx) => {
    const currentStructureTypologyIndex = getStructureTypologyIndexForAYear(
      data.structureTypologies,
      CURRENT_YEAR
    );

    if (currentStructureTypologyIndex === -1) {
      return;
    }

    if (
      !(
        !!data.structureTypologies[currentStructureTypologyIndex]
          ?.placesACreer ||
        data.structureTypologies[currentStructureTypologyIndex]
          ?.placesACreer === 0
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le nombre de place à créer est obligatoire",
        path: [
          "structureTypologies",
          currentStructureTypologyIndex,
          "placesACreer",
        ],
      });
    }

    if (
      !(
        !!data.structureTypologies[currentStructureTypologyIndex]
          ?.placesAFermer ||
        data.structureTypologies[currentStructureTypologyIndex]
          ?.placesAFermer === 0
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le nombre de place à fermer est obligatoire",
        path: [
          "structureTypologies",
          currentStructureTypologyIndex,
          "placesAFermer",
        ],
      });
    }

    if (
      !(
        data.structureTypologies[currentStructureTypologyIndex]
          ?.placesACreer === 0 ||
        !!data.structureTypologies[currentStructureTypologyIndex]
          ?.echeancePlacesACreer
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce champ est obligatoire s'il y a au moins une place à créer",
        path: [
          "structureTypologies",
          currentStructureTypologyIndex,
          "echeancePlacesACreer",
        ],
      });
    }

    if (
      !(
        data.structureTypologies[currentStructureTypologyIndex]
          ?.placesAFermer === 0 ||
        !!data.structureTypologies[currentStructureTypologyIndex]
          ?.echeancePlacesAFermer
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Ce champ est obligatoire s'il y a au moins une place à fermer",
        path: [
          "structureTypologies",
          currentStructureTypologyIndex,
          "echeancePlacesAFermer",
        ],
      });
    }
  });

export type StructureTypologieWithoutEvolutionSchemaTypeFormValues = z.infer<
  typeof structureTypologieWithoutEvolutionSchema
>;

export type structureTypologieSchemaTypeFormValues = z.infer<
  typeof structureTypologieSchema
>;
