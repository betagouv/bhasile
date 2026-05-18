import { z } from "zod";

import { PublicType, StructureType } from "@/types/structure.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { adresseApiSchema } from "./adresse.schema";
import { antenneApiSchema } from "./antenne.schema";
import { contactApiSchema } from "./contact.schema";
import { finessApiSchema } from "./finess.schema";
import { formApiSchema } from "./form.schema";
import { structureMillesimeApiSchema } from "./structure-millesime.schema";
import { structureTypologieApiSchema } from "./structure-typologie.schema";

const dnaStructureTransformationApiSchema = z.object({
  id: z.number().optional(),
  dna: z.object({
    id: z.number().optional(),
    code: z.string(),
    description: z.string().nullish(),
  }),
});

const structureTransformationApiUpdateSchema = z.object({
  id: z.number().optional(),
  structureId: z.number().optional(),
  structureTransformationType: z
    .nativeEnum(StructureTransformationType)
    .optional(),
  structureTransformationDate: z.string().datetime().nullish(),
  structureTransformationMotif: z.string().nullish(),

  type: z.nativeEnum(StructureType).nullish(),
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
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  structureMillesimes: z.array(structureMillesimeApiSchema).optional(),
  structureTypologies: z.array(structureTypologieApiSchema).optional(),
});

export const structureTransformationApiCreateSchema =
  structureTransformationApiUpdateSchema.extend({
    structureTransformationType: z.nativeEnum(StructureTransformationType),
  });
export const transformationApiUpdateSchema = z.object({
  id: z.number(),
  type: z.nativeEnum(TransformationType).optional(),
  form: formApiSchema.optional(),
  structureTransformations: z
    .array(structureTransformationApiUpdateSchema)
    .optional(),
});

export const transformationApiCreateSchema = z.object({
  type: z.nativeEnum(TransformationType),
  structureTransformations: z
    .array(structureTransformationApiCreateSchema)
    .min(1, "Au moins une structureTransformation est requise"),
});

export type StructureTransformationApiUpdate = z.infer<
  typeof structureTransformationApiUpdateSchema
>;
export type StructureTransformationApiCreate = z.infer<
  typeof structureTransformationApiCreateSchema
>;
export type StructureTransformationApiRead =
  StructureTransformationApiUpdate & {
    structureTransformationType: StructureTransformationType;
    structure?: {
      codeBhasile: string;
    };
  };

export type DnaStructureTransformationApiType = z.infer<
  typeof dnaStructureTransformationApiSchema
>;
export type TransformationApiUpdate = z.infer<
  typeof transformationApiUpdateSchema
>;
export type TransformationApiCreate = z.infer<
  typeof transformationApiCreateSchema
>;
export type TransformationApiRead = Omit<
  TransformationApiUpdate,
  "structureTransformations"
> & {
  id: number;
  structureTransformations: StructureTransformationApiRead[];
};
