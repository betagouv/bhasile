import { z } from "zod";

import { PublicType } from "@/types/structure.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { adresseApiSchema } from "./adresse.schema";
import { antenneApiSchema } from "./antenne.schema";
import { contactApiSchema } from "./contact.schema";
import { finessApiSchema } from "./finess.schema";
import { formApiSchema } from "./form.schema";
import { structureMillesimeApiSchema } from "./structure-millesime.schema";
import { structureTypologieApiSchema } from "./structure-typologie.schema";

export const dnaStructureTransformationApiSchema = z.object({
  id: z.number().optional(),
  dna: z.object({
    id: z.number().optional(),
    code: z.string(),
    description: z.string().nullish(),
  }),
});

export const structureTransformationApiSchema = z.object({
  id: z.number().optional(),
  structureId: z.number().optional(),
  type: z.nativeEnum(StructureTransformationType).optional(),
  date: z.string().datetime().nullish(),
  motif: z.string().nullish(),

  public: z.nativeEnum(PublicType).nullish(),
  adresseAdministrative: z.string().nullish(),
  codePostalAdministratif: z.string().nullish(),
  communeAdministrative: z.string().nullish(),
  departementAdministratif: z.string().nullish(),
  nom: z.string().nullish(),
  placesAutorisees: z.number().int().nullish(),
  pmr: z.number().int().nullish(),
  lgbt: z.number().int().nullish(),
  fvvTeh: z.number().int().nullish(),

  contacts: z.array(contactApiSchema).optional(),
  adresses: z.array(adresseApiSchema).optional(),
  finesses: z.array(finessApiSchema).optional(),
  antennes: z.array(antenneApiSchema).optional(),
  dnas: z.array(dnaStructureTransformationApiSchema).optional(),
  structureMillesimes: z.array(structureMillesimeApiSchema).optional(),
  structureTypologies: z.array(structureTypologieApiSchema).optional(),
});

export const transformationApiWriteSchema = z.object({
  id: z.number(),
  type: z.nativeEnum(TransformationType).optional(),
  form: formApiSchema.optional(),
  structureTransformations: z
    .array(structureTransformationApiSchema)
    .optional(),
});

export const transformationApiCreationSchema = z.object({
  type: z.nativeEnum(TransformationType),
  structureTransformations: z
    .array(
      structureTransformationApiSchema.extend({
        structureId: z.number(),
        type: z.nativeEnum(StructureTransformationType),
      })
    )
    .min(1, "Au moins une structureTransformation est requise"),
});

export type StructureTransformationApiType = z.infer<
  typeof structureTransformationApiSchema
>;
export type DnaStructureTransformationApiType = z.infer<
  typeof dnaStructureTransformationApiSchema
>;
export type TransformationApiWrite = z.infer<
  typeof transformationApiWriteSchema
>;
export type TransformationApiCreation = z.infer<
  typeof transformationApiCreationSchema
>;
export type TransformationApiRead = TransformationApiWrite;
