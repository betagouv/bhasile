import { recursivelySerializeDates } from "@/app/utils/date.util";
import { getTransformationDepartement } from "@/app/utils/transformation.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import {
  StructureVersionTransformationApiCreate,
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";

import { buildAdresseAdministrativeComplete } from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import {
  copyStructureVersion,
  dbStructureVersionToApiRead,
} from "../structure-versions/structure-version.service";
import { getResolvedStructure } from "../structures/structure.service";
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
    structureVersionTransformations: transformation.structureVersionTransformations.map(
      (structureVersionTransformation) => {
        const structureVersion = structureVersionTransformation.structureVersion;
        return {
          ...structureVersionTransformation,
          operateur: structureVersionTransformation.operateur ?? undefined,
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
                      antennes: getAntennesApiRead(
                        structureVersion.structure.antennes
                      ),
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
  const structureVersionTransformationsWithSource = await Promise.all(
    transformation.structureVersionTransformations.map(
      enrichStructureVersionTransformationFromSource
    )
  );

  const structureVersionTransformations = applyPrefill(
    transformation.type,
    structureVersionTransformationsWithSource
  );

  return createOne({ ...transformation, structureVersionTransformations });
};

const enrichStructureVersionTransformationFromSource = async (
  structureVersionTransformation: StructureVersionTransformationApiCreate
): Promise<StructureVersionTransformationApiCreate> => {
  const structureId = structureVersionTransformation.structureVersion?.structureId;
  if (!structureId) {
    return structureVersionTransformation;
  }

  const structure = await getResolvedStructure(structureId);
  if (!structure) {
    return structureVersionTransformation;
  }

  return {
    ...structureVersionTransformation,
    structureVersion: copyStructureVersion(
      structure,
      structureVersionTransformation.structureVersion
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
