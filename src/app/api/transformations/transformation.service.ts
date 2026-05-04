import { recursivelySerializeDates } from "@/app/utils/date.util";
import {
  TransformationApiCreation,
  TransformationApiRead,
  TransformationApiWrite,
} from "@/schemas/api/transformation.schema";

import {
  createTransformation as createTransformationRepository,
  findOne,
  updateTransformation as updateTransformationRepository,
} from "./transformation.repository";

export const getFullTransformation = async (
  id: number
): Promise<TransformationApiRead> => {
  const dbTransformation = await findOne(id);
  return recursivelySerializeDates(dbTransformation) as TransformationApiRead;
};

export const createTransformation = async (
  input: TransformationApiCreation
): Promise<number> => {
  return createTransformationRepository(input);
};

export const updateTransformation = async (
  input: TransformationApiWrite
): Promise<void> => {
  return updateTransformationRepository(input);
};
