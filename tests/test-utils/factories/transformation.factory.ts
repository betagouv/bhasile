import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

type StructureTransformationApiReadItem =
  TransformationApiRead["structureTransformations"][number];

export const createTransformation = ({
  id = 42,
  type = TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
  structureTransformations = [],
}: {
  id?: number;
  type?: TransformationType;
  structureTransformations?: TransformationApiRead["structureTransformations"];
} = {}): TransformationApiRead => ({
  id,
  type,
  structureTransformations,
});

export const createStructureTransformation = ({
  id = 7,
  type = StructureTransformationType.CREATION,
  ...overrides
}: Partial<StructureTransformationApiReadItem> = {}): StructureTransformationApiReadItem => ({
  id,
  type,
  ...overrides,
});
