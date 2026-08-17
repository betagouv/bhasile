import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import { getNow } from "@/app/utils/now.util";
import { getTransformationDepartement } from "@/app/utils/transformation.util";
import { isTransformationFinalised } from "@/app/utils/transformation.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import {
  StructureVersionTransformationApiCreate,
  StructureVersionTransformationApiUpdate,
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
  TransformationSelectionApiUpdate,
} from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";
import { StructureType } from "@/types/structure.type";
import {
  DepartementBearingStructureVersionTransformation,
  TransformationType,
} from "@/types/transformation.type";
import { recursivelySerializeForClient } from "@/utils-server/serialization.server.util";

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
import type { ResolvedStructureDetails } from "../structures/structure.db.type";
import { findStructureDepartement } from "../structures/structure.repository";
import {
  getResolvedStructure,
  mergeStructureWithVersion,
} from "../structures/structure.service";
import { isStructureFinalised } from "../structures/structure.util";
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
  checkCanUpdateDepartements,
  checkEffectiveDatesAreValid,
  checkNoDuplicateStructureIds,
  checkUniqueDepartement,
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
  recursivelySerializeForClient({
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
                        isFinalised: isStructureFinalised(
                          {
                            forms: sourceStructure?.forms,
                            structureVersions:
                              sourceStructure?.structureVersions,
                          },
                          now
                        ),
                        forms: undefined,
                        placesAutorisees:
                          referenceVersion?.placesAutorisees ?? null,
                        adresseAdministrativeComplete:
                          buildAdresseAdministrativeComplete(
                            resolvedSourceStructure
                          ) || undefined,
                        antennes: getAntennesApiRead(
                          (
                            resolvedSourceStructure as unknown as ResolvedStructureDetails
                          ).antennes
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
  return dbTransformationToApiRead(dbTransformation, getNow());
};

export const getOngoingTransformationsForUser = async (
  user: SessionUser
): Promise<TransformationApiRead[]> => {
  const dbTransformations = await findAll();
  const now = getNow();
  return dbTransformations
    .map((dbTransformation) => dbTransformationToApiRead(dbTransformation, now))
    .filter((transformation) => {
      const departement = getTransformationDepartement(transformation);
      return !departement || canUpdateDepartement(user, departement);
    });
};

const prepareStructureVersionTransformations = async (
  type: TransformationType,
  structureVersionTransformations: StructureVersionTransformationApiCreate[],
  user: SessionUser | undefined
): Promise<StructureVersionTransformationApiCreate[]> => {
  checkNoDuplicateStructureIds(structureVersionTransformations);
  checkEffectiveDatesAreValid(structureVersionTransformations);

  const structureVersionTransformationsWithSource = await Promise.all(
    structureVersionTransformations.map(
      enrichStructureVersionTransformationFromSource
    )
  );

  checkUniqueDepartement(structureVersionTransformationsWithSource);
  checkCanUpdateDepartements(user, structureVersionTransformationsWithSource);

  return applyPrefill(type, structureVersionTransformationsWithSource);
};

export const createTransformation = async (
  transformation: TransformationApiCreate,
  user?: SessionUser,
  numeroDossier?: string
): Promise<number> => {
  const structureVersionTransformations =
    await prepareStructureVersionTransformations(
      transformation.type,
      transformation.structureVersionTransformations,
      user
    );

  return createOne(
    { ...transformation, structureVersionTransformations },
    numeroDossier
  );
};

export const resetTransformationSelection = async (
  input: TransformationSelectionApiUpdate,
  user: SessionUser
): Promise<TransformationApiRead | null> => {
  const structureVersionTransformations =
    await prepareStructureVersionTransformations(
      input.type,
      input.structureVersionTransformations,
      user
    );

  const transformationId = await resetSelection({
    ...input,
    structureVersionTransformations,
  });

  return getTransformation(transformationId);
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
    structureVersion: {
      ...copyStructureVersion(
        structure,
        structureVersionTransformation.structureVersion
      ),
      departementAdministratif: structure.departementAdministratif ?? undefined,
    },
  };
};

const resolveStructureDepartements = async (
  structureVersionTransformations: StructureVersionTransformationApiUpdate[]
): Promise<DepartementBearingStructureVersionTransformation[]> => {
  const structureIds = [
    ...new Set(
      structureVersionTransformations
        .map(
          (structureVersionTransformation) =>
            structureVersionTransformation.structureVersion?.structureId
        )
        .filter((structureId): structureId is number => structureId != null)
    ),
  ];

  return Promise.all(
    structureIds.map(async (structureId) => ({
      structureVersion: await findStructureDepartement(structureId),
    }))
  );
};

export const updateTransformation = async (
  input: TransformationApiUpdate,
  transformation: TransformationApiRead,
  user?: SessionUser
): Promise<number> => {
  checkEffectiveDatesAreValid(input.structureVersionTransformations ?? []);

  const inputStructureVersionTransformations =
    input.structureVersionTransformations ?? [];

  checkCanUpdateDepartements(user, [
    ...transformation.structureVersionTransformations,
    ...inputStructureVersionTransformations,
    ...(await resolveStructureDepartements(inputStructureVersionTransformations)),
  ]);

  return updateOne(input);
};

export const deleteTransformation = async (id: number): Promise<void> => {
  const transformation = await findOne(id);
  if (!transformation) {
    throw new ApiDomainError("Transformation non trouvée", 404);
  }
  if (isTransformationFinalised(transformation)) {
    throw new ApiDomainError(
      "Impossible de supprimer une transformation finalisée"
    );
  }
  await deleteOne(id);
};
