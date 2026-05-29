import { recursivelySerializeDates } from "@/app/utils/date.util";
import {
  StructureTransformationApiCreate,
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";

import {
  dbStructureVersionToApiRead,
  mapStructureToVersionInput,
} from "../structure-versions/structure-version.service";
import { getStructure } from "../structures/structure.service";
import { TransformationDbDetails } from "./transformation.db.type";
import {
  createOne,
  deleteOne,
  findOne,
  updateOne,
} from "./transformation.repository";
import { applyPrefill } from "./transformation.util";

const dbTransformationToApiRead = (
  transformation: TransformationDbDetails
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
  // Couche A : chaque structureTransformation liée à une structure existante est
  // initialisée avec l'état courant de cette structure.
  const structureTransformationsWithSource = await Promise.all(
    input.structureTransformations.map(enrichStructureTransformationFromSource)
  );

  // Couche B : on ajoute aux cibles les champs déclarés, agrégés depuis les sources.
  const structureTransformations = applyPrefill(
    input.type,
    structureTransformationsWithSource
  );

  return createOne({ ...input, structureTransformations });
};

const enrichStructureTransformationFromSource = async (
  structureTransformation: StructureTransformationApiCreate
): Promise<StructureTransformationApiCreate> => {
  const structureId = structureTransformation.structureVersion?.structureId;
  if (!structureId) {
    return structureTransformation;
  }

  const structure = await getStructure(structureId);

  return {
    ...structureTransformation,
    structureVersion: mapStructureToVersionInput(
      structure,
      structureTransformation.structureVersion
    ),
  };
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
