import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

type StructureVersionTransformationApiReadItem =
  TransformationApiRead["structureVersionTransformations"][number];

export const createTransformation = ({
  id = 42,
  type = TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
  structureVersionTransformations = [],
}: {
  id?: number;
  type?: TransformationType;
  structureVersionTransformations?: TransformationApiRead["structureVersionTransformations"];
} = {}): TransformationApiRead => ({
  id,
  type,
  structureVersionTransformations,
});

export const createStructureVersionTransformation = ({
  id = 7,
  type = StructureVersionTransformationType.CREATION,
  ...overrides
}: Partial<StructureVersionTransformationApiReadItem> = {}): StructureVersionTransformationApiReadItem => ({
  id,
  type,
  ...overrides,
});
