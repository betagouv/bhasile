import { z } from "zod";

import { StructureParentActe } from "@/types/acte-administratif.type";
import { Repartition } from "@/types/adresse.type";
import { ExcludeNullValues } from "@/types/global";
import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { AntenneApiType } from "./antenne.schema";
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
  type: z.enum(StructureVersionTransformationType).optional(),
  motif: z.string().nullish(),
  form: formApiSchema.optional(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  operateurId: z.number().nullish(),
  structureType: z.enum(StructureType).nullish(),

  structureVersion: structureVersionApiSchema.optional(),
});

export const structureVersionTransformationApiCreateSchema =
  structureVersionTransformationApiUpdateSchema.extend({
    type: z.enum(StructureVersionTransformationType),
  });

export const transformationApiUpdateSchema = z.object({
  id: z.number(),
  type: z.enum(TransformationType).optional(),
  form: formApiSchema.optional(),
  structureVersionTransformations: z
    .array(structureVersionTransformationApiUpdateSchema)
    .optional(),
});

export const transformationApiCreateSchema = z.object({
  type: z.enum(TransformationType),
  structureVersionTransformations: z
    .array(structureVersionTransformationApiCreateSchema)
    .min(1, "Au moins une structureVersionTransformation est requise"),
});

export const transformationSelectionApiUpdateSchema = z.object({
  id: z.number(),
  type: z.enum(TransformationType),
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
        antennes?: AntenneApiType[];
        actesAdministratifs?: StructureParentActe[];
        structureTypologies?: {
          year: number;
          placesAutorisees: number | null;
        }[];
      };
    };
  };

export type TransformationApiUpdate = z.infer<
  typeof transformationApiUpdateSchema
>;

export type TransformationApiCreate = z.infer<
  typeof transformationApiCreateSchema
>;

export type TransformationSelectionApiUpdate = z.infer<
  typeof transformationSelectionApiUpdateSchema
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
