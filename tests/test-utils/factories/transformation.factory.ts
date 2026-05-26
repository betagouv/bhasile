import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

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
