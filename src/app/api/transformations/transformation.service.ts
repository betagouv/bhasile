import { recursivelySerializeDates } from "@/app/utils/date.util";
import {
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";

import { dbStructureVersionToApiRead } from "../structure-versions/structure-version.service";
import { TransformationDb } from "./transformation.db.type";
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
  return dbTransformationToApiRead(dbTransformation);
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

const dbTransformationToApiRead = (
  transformation: TransformationDb
): TransformationApiRead =>
  recursivelySerializeDates({
    ...transformation,
    structureTransformations: transformation.structureTransformations.map(
      (structureTransformation) => ({
        ...structureTransformation,
        operateur: structureTransformation.operateur ?? undefined,
        structureVersion: structureTransformation.structureVersion
          ? dbStructureVersionToApiRead(
              structureTransformation.structureVersion
            )
          : undefined,
      })
    ),
  }) as TransformationApiRead;
