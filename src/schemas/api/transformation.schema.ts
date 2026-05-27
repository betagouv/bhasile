import { z } from "zod";

import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { formApiSchema } from "./form.schema";
import { structureVersionApiSchema } from "./structure-version.schema";

const structureTransformationApiUpdateSchema = z.object({
  id: z.number().optional(),
  type: z.nativeEnum(StructureTransformationType).optional(),
  date: z.string().datetime().nullish(),
  motif: z.string().nullish(),
  forms: z.array(formApiSchema).optional(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),

  structureVersion: structureVersionApiSchema.optional(),
});

export const structureTransformationApiCreateSchema =
  structureTransformationApiUpdateSchema.extend({
    type: z.nativeEnum(StructureTransformationType),
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
    type: StructureTransformationType;
    structureVersion?: StructureTransformationApiUpdate["structureVersion"] & {
      structure?: {
        codeBhasile: string;
      };
    };
  };

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
