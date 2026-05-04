import { recursivelySerializeDates } from "@/app/utils/date.util";
import {
  TransformationApiCreation,
  TransformationApiRead,
  TransformationApiWrite,
} from "@/schemas/api/transformation.schema";

import { createOne, findOne, updateOne } from "./transformation.repository";

export const getTransformation = async (
  id: number
): Promise<TransformationApiRead | null> => {
  const dbTransformation = await findOne(id);
  if (!dbTransformation) {
    return null;
  }
  return recursivelySerializeDates(dbTransformation) as TransformationApiRead;
};

export const createTransformation = async (
  input: TransformationApiCreation
): Promise<number> => {
  return createOne(input);
};

export const updateTransformation = async (
  input: TransformationApiWrite
): Promise<void> => {
  return updateOne(input);
};
