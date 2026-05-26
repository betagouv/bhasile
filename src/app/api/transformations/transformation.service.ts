import { recursivelySerializeDates } from "@/app/utils/date.util";
import {
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";

import { getStructureVersionApiRead } from "../structure-versions/structure-version.util";
import {
  createOne,
  deleteOne,
  findOne,
  updateOne,
} from "./transformation.repository";

export const getTransformation = async (
  id: number
): Promise<TransformationApiRead | null> => {
  const dbTransformation = await findOne(id);
  if (!dbTransformation) {
    return null;
  }
  const transformed = {
    ...dbTransformation,
    structureTransformations: dbTransformation.structureTransformations.map(
      (st) => ({
        ...st,
        structureVersion: st.structureVersion
          ? getStructureVersionApiRead(st.structureVersion)
          : undefined,
      })
    ),
  };
  return recursivelySerializeDates(transformed) as TransformationApiRead;
};

export const createTransformation = async (
  input: TransformationApiCreate
): Promise<number> => {
  return createOne(input);
};

export const updateTransformation = async (
  input: TransformationApiUpdate
): Promise<number> => {
  return updateOne(input);
};

export const deleteTransformation = async (id: number): Promise<void> => {
  const transformation = await findOne(id);
  if (transformation?.form?.status === true) {
    throw new Error("Impossible de supprimer une transformation finalisée");
  }
  await deleteOne(id);
};
