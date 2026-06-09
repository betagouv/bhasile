import { z } from "zod";

import { Repartition } from "@/types/adresse.type";
import { ExcludeNullValues } from "@/types/global";
import {
  StructureVersionTransformationType,
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
    typeBati?: Repartition;
  };

const structureVersionTransformationApiUpdateSchema = z.object({
  id: z.number().optional(),
  type: z.nativeEnum(StructureVersionTransformationType).optional(),
  motif: z.string().nullish(),
  form: formApiSchema.optional(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  operateurId: z.number().nullish(),

  structureVersion: structureVersionApiSchema.optional(),
});

export const structureVersionTransformationApiCreateSchema =
  structureVersionTransformationApiUpdateSchema.extend({
    type: z.nativeEnum(StructureVersionTransformationType),
  });

export const transformationApiUpdateSchema = z.object({
  id: z.number(),
  type: z.nativeEnum(TransformationType).optional(),
  form: formApiSchema.optional(),
  structureVersionTransformations: z
    .array(structureVersionTransformationApiUpdateSchema)
    .optional(),
});

export const transformationApiCreateSchema = z.object({
  type: z.nativeEnum(TransformationType),
  structureVersionTransformations: z
    .array(structureVersionTransformationApiCreateSchema)
    .min(1, "Au moins une structureVersionTransformation est requise"),
});

export type StructureVersionTransformationApiUpdate = z.infer<
  typeof structureVersionTransformationApiUpdateSchema
>;
export type StructureVersionTransformationApiCreate = z.infer<
  typeof structureVersionTransformationApiCreateSchema
>;
export type StructureVersionTransformationApiRead =
  StructureVersionTransformationApiUpdate & {
    type: StructureVersionTransformationType;
    operateur?: { id: number; name: string };
    structureVersion?: StructureVersionApiRead & {
      structure?: {
        codeBhasile: string;
        operateur?: { id: number; name: string };
        nom?: string | null;
        adresseAdministrative?: string | null;
        adresseAdministrativeComplete?: string;
        codePostalAdministratif?: string | null;
        communeAdministrative?: string | null;
        departementAdministratif?: string | null;
        structureTypologies?: { year: number; placesAutorisees: number | null }[];
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

export type StructureVersionTransformationApiUpdateClient = z.input<
  typeof structureVersionTransformationApiUpdateSchema
>;

export type TransformationApiRead = Omit<
  TransformationApiUpdate,
  "structureVersionTransformations"
> & {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  structureVersionTransformations: StructureVersionTransformationApiRead[];
};
