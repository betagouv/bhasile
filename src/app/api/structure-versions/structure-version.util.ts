import { startOfNextUtcDay } from "@/app/utils/date.util";
import { StructureType } from "@/generated/prisma/client";

type VersionFields = {
  type: StructureType | null;
  communeAdministrative: string | null;
};

export type ResolvableVersion = {
  id: number;
  effectiveDate: Date | null;
  structureVersionTransformationId: number | null;
  structureVersionTransformation:
    | {
        transformation: { form: { status: boolean | null } | null } | null;
      }
    | null;
};

export const isVersionValid = (version: ResolvableVersion): boolean => {
  if (version.structureVersionTransformationId === null) {
    return true;
  }
  return (
    version.structureVersionTransformation?.transformation?.form?.status ===
    true
  );
};

const sortValidVersionsBefore = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  upperBoundMs: number
): TVersion[] =>
  versions
    .filter(
      (version) =>
        version.effectiveDate !== null &&
        version.effectiveDate.getTime() < upperBoundMs &&
        isVersionValid(version)
    )
    .sort((first, second) => {
      const dateDiff =
        (second.effectiveDate?.getTime() ?? 0) -
        (first.effectiveDate?.getTime() ?? 0);
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return second.id - first.id;
    });

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
  TStructure extends { structureVersions: (ResolvableVersion & VersionFields)[] },
>(
  structure: TStructure,
  now: Date
): Omit<TStructure, "structureVersions"> & VersionFields => {
  const { structureVersions, ...structureRest } = structure;
  const currentVersion = resolveCurrentVersion(structureVersions, now);
  return {
    ...structureRest,
    type: currentVersion?.type ?? null,
    communeAdministrative: currentVersion?.communeAdministrative ?? null,
  };
};
