import { z } from "zod";

import { ExcludeNullValues } from "@/types/global";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { formApiSchema } from "./form.schema";
import {
  structureVersionApiSchema,
  StructureVersionApiType,
} from "./structure-version.schema";

export type StructureVersionApiRead =
  ExcludeNullValues<StructureVersionApiType> & {
    adresseAdministrativeComplete?: string;
    isMultiAntenne?: boolean;
    isMultiDna?: boolean;
  };

const structureTransformationApiUpdateSchema = z.object({
  id: z.number().optional(),
  type: z.nativeEnum(StructureTransformationType).optional(),
  date: z.string().datetime().nullish(),
  motif: z.string().nullish(),
  forms: z.array(formApiSchema).optional(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  operateurId: z.number().nullish(),

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
    operateur?: { id: number; name: string };
    structureVersion?: StructureVersionApiRead & {
      structure?: {
        codeBhasile: string;
        departementAdministratif?: string;
        operateur?: { id: number; name: string };
        nom?: string | null;
        adresseAdministrative?: string | null;
        adresseAdministrativeComplete?: string;
        codePostalAdministratif?: string | null;
        communeAdministrative?: string | null;
        departementAdministratif?: string | null;
      };
    };
  };

export type TransformationApiUpdate = z.infer<
  typeof transformationApiUpdateSchema
>;

export type TransformationApiCreate = z.infer<
  typeof transformationApiCreateSchema
>;

export type TransformationApiUpdateClient = z.input<
  typeof transformationApiUpdateSchema
>;

export type StructureTransformationApiUpdateClient = z.input<
  typeof structureTransformationApiUpdateSchema
>;

export type TransformationApiRead = Omit<
  TransformationApiUpdate,
  "structureTransformations"
> & {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  structureTransformations: StructureTransformationApiRead[];
};
