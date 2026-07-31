import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import { startOfNextUtcDay } from "@/app/utils/date.util";
import {
  OrderableStructureVersion,
  sortStructureVersionsBefore,
} from "@/app/utils/structureVersion.util";

export const checkNoDepartementAdministratifChange = (
  structureDepartement: string | null | undefined,
  versionDepartement: string | null | undefined
): void => {
  if (structureDepartement == null) {
    return;
  }
  if (versionDepartement == null) {
    return;
  }
  if (versionDepartement !== structureDepartement) {
    throw new ApiDomainError(
      "Une structure ne peut pas changer de département administratif."
    );
  }
};

export const checkCreatedStructureDepartement = (
  baseDepartement: string | null | undefined,
  createdDepartement: string | null | undefined
): void => {
  if (!baseDepartement || !createdDepartement) {
    return;
  }
  if (baseDepartement !== createdDepartement) {
    throw new ApiDomainError(
      `La structure créée doit appartenir au même département que les structures d'origine (${baseDepartement}).`
    );
  }
};

type VersionFields = {
  communeAdministrative: string | null;
};

export type ResolvableVersion = OrderableStructureVersion & {
  structureVersionTransformationId: number | null;
  structureVersionTransformation: {
    transformation: { form: { status: boolean | null } | null } | null;
  } | null;
};

export const isVersionValid = (version: ResolvableVersion): boolean => {
  if (version.structureVersionTransformationId !== null) {
    return (
      version.structureVersionTransformation?.transformation?.form?.status ===
      true
    );
  }
  return true;
};

const sortValidVersionsBefore = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  upperBoundMs: number
): TVersion[] =>
  sortStructureVersionsBefore(versions.filter(isVersionValid), upperBoundMs);

export const getValidVersions = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  now: Date
): TVersion[] =>
  sortValidVersionsBefore(versions, startOfNextUtcDay(now).getTime());

export const resolveCurrentVersion = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  now: Date
): TVersion | undefined => getValidVersions(versions, now)[0];

export const resolvePredecessor = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  effectiveDate: Date
): TVersion | undefined =>
  sortValidVersionsBefore(versions, effectiveDate.getTime())[0];

export const resolveCurrentVersionFields = <
  TStructure extends {
    structureVersions: (ResolvableVersion & VersionFields)[];
  },
>(
  structure: TStructure,
  now: Date
): Omit<TStructure, "structureVersions"> & VersionFields => {
  const { structureVersions, ...structureRest } = structure;
  const currentVersion = resolveCurrentVersion(structureVersions, now);
  return {
    ...structureRest,
    communeAdministrative: currentVersion?.communeAdministrative ?? null,
  };
};
