import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import { recursivelySerializeDates } from "@/app/utils/date.util";
import { getTransformationDepartement } from "@/app/utils/transformation.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import {
  StructureVersionTransformationApiCreate,
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
  TransformationSelectionApiUpdate,
} from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";
import { StructureType } from "@/types/structure.type";
import { TransformationType } from "@/types/transformation.type";

import { buildAdresseAdministrativeComplete } from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import {
  copyStructureVersion,
  dbStructureVersionToApiRead,
} from "../structure-versions/structure-version.service";
import {
  ResolvableVersion,
  resolveCurrentVersion,
  resolvePredecessor,
} from "../structure-versions/structure-version.util";
import {
  getResolvedStructure,
  mergeStructureWithVersion,
} from "../structures/structure.service";
import { TransformationDbDetails } from "./transformation.db.type";
import {
  createOne,
  deleteOne,
  findAll,
  findOne,
  resetSelection,
  updateOne,
} from "./transformation.repository";
import {
  applyPrefill,
  checkNoDuplicateStructureIds,
} from "./transformation.util";

const resolveReferenceVersion = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  effectiveDate: Date | null,
  now: Date
): TVersion | undefined => {
  if (effectiveDate) {
    return resolvePredecessor(versions, effectiveDate);
  }
  return resolveCurrentVersion(versions, now);
};

const dbTransformationToApiRead = (
  transformation: TransformationDbDetails,
  now: Date
): TransformationApiRead =>
  recursivelySerializeDates({
    ...transformation,
    structureVersionTransformations:
      transformation.structureVersionTransformations.map(
        (structureVersionTransformation) => {
          const structureVersion =
            structureVersionTransformation.structureVersion;
          const sourceStructure = structureVersion?.structure;
          const referenceVersion = sourceStructure
            ? resolveReferenceVersion(
                sourceStructure.structureVersions,
                structureVersion?.effectiveDate ?? null,
                now
              )
            : undefined;
          const resolvedSourceStructure =
            sourceStructure && referenceVersion
              ? mergeStructureWithVersion(sourceStructure, referenceVersion)
              : sourceStructure;
          return {
            ...structureVersionTransformation,
            operateur: structureVersionTransformation.operateur ?? undefined,
            structureVersion: structureVersion
              ? {
                  ...dbStructureVersionToApiRead(structureVersion),
                  structure: resolvedSourceStructure
                    ? {
                        ...resolvedSourceStructure,
                        adresseAdministrativeComplete:
                          buildAdresseAdministrativeComplete(
                            resolvedSourceStructure
                          ) || undefined,
                        antennes: getAntennesApiRead(
                          resolvedSourceStructure.antennes
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
  return dbTransformationToApiRead(dbTransformation, new Date());
};

export const getOngoingTransformationsForUser = async (
  user: SessionUser
): Promise<TransformationApiRead[]> => {
  const dbTransformations = await findAll();
  const now = new Date();
  return dbTransformations
    .map((dbTransformation) => dbTransformationToApiRead(dbTransformation, now))
    .filter((transformation) =>
      canUpdateDepartement(user, getTransformationDepartement(transformation))
    );
};

const prepareStructureVersionTransformations = async (
  type: TransformationType,
  structureVersionTransformations: StructureVersionTransformationApiCreate[]
): Promise<StructureVersionTransformationApiCreate[]> => {
  checkNoDuplicateStructureIds(structureVersionTransformations);

  const structureVersionTransformationsWithSource = await Promise.all(
    structureVersionTransformations.map(
      enrichStructureVersionTransformationFromSource
    )
  );

  return applyPrefill(type, structureVersionTransformationsWithSource);
};

export const createTransformation = async (
  transformation: TransformationApiCreate
): Promise<number> => {
  const structureVersionTransformations =
    await prepareStructureVersionTransformations(
      transformation.type,
      transformation.structureVersionTransformations
    );

  return createOne({ ...transformation, structureVersionTransformations });
};

export const resetTransformationSelection = async (
  input: TransformationSelectionApiUpdate
): Promise<number> => {
  const structureVersionTransformations =
    await prepareStructureVersionTransformations(
      input.type,
      input.structureVersionTransformations
    );

  return resetSelection({ ...input, structureVersionTransformations });
};

const enrichStructureVersionTransformationFromSource = async (
  structureVersionTransformation: StructureVersionTransformationApiCreate
): Promise<StructureVersionTransformationApiCreate> => {
  const structureId =
    structureVersionTransformation.structureVersion?.structureId;
  if (!structureId) {
    return structureVersionTransformation;
  }

  const structure = await getResolvedStructure(structureId);
  if (!structure) {
    return structureVersionTransformation;
  }

  return {
    ...structureVersionTransformation,
    operateurId: structure.operateurId ?? undefined,
    structureType: structure.type
      ? StructureType[structure.type as keyof typeof StructureType]
      : undefined,
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
    throw new ApiDomainError(
      "Impossible de supprimer une transformation finalisée"
    );
  }
  await deleteOne(id);
};
