import { recursivelySerializeDates } from "@/app/utils/date.util";
import { getTransformationDepartement } from "@/app/utils/transformation.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import {
  StructureTransformationApiCreate,
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";

import { buildAdresseAdministrativeComplete } from "../adresses/adresse.util";
import {
  copyStructureVersion,
  dbStructureVersionToApiRead,
} from "../structure-versions/structure-version.service";
import { getStructure } from "../structures/structure.service";
import { TransformationDbDetails } from "./transformation.db.type";
import {
  createOne,
  deleteOne,
  findAll,
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
      (structureTransformation) => {
        const structureVersion = structureTransformation.structureVersion;
        return {
          ...structureTransformation,
          operateur: structureTransformation.operateur ?? undefined,
          structureVersion: structureVersion
            ? {
                ...dbStructureVersionToApiRead(structureVersion),
                structure: structureVersion.structure
                  ? {
                      ...structureVersion.structure,
                      adresseAdministrativeComplete:
                        buildAdresseAdministrativeComplete(
                          structureVersion.structure
                        ) || undefined,
                    }
                  : undefined,
              }
            : undefined,
        };
      }
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

export const getOngoingTransformationsForUser = async (
  user: SessionUser
): Promise<TransformationApiRead[]> => {
  const dbTransformations = await findAll();
  return dbTransformations
    .map(dbTransformationToApiRead)
    .filter((transformation) =>
      canUpdateDepartement(user, getTransformationDepartement(transformation))
    );
};

export const createTransformation = async (
  transformation: TransformationApiCreate
): Promise<number> => {
  const structureTransformationsWithSource = await Promise.all(
    transformation.structureTransformations.map(
      enrichStructureTransformationFromSource
    )
  );

  const structureTransformations = applyPrefill(
    transformation.type,
    structureTransformationsWithSource
  );

  return createOne({ ...transformation, structureTransformations });
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
    structureVersion: copyStructureVersion(
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
