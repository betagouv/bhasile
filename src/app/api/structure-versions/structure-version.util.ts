import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import { startOfNextUtcDay } from "@/app/utils/date.util";
import { isTransformationFinalised } from "@/app/utils/transformation.util";

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

export type OrderableVersion = {
  id: number;
  effectiveDate: Date | null;
};

export type ResolvableVersion = OrderableVersion & {
  structureVersionTransformationId: number | null;
  structureVersionTransformation: {
    transformation: { form: { status: boolean } | null } | null;
  } | null;
};

export const isVersionValid = (version: ResolvableVersion): boolean => {
  if (version.structureVersionTransformationId !== null) {
    return isTransformationFinalised(
      version.structureVersionTransformation?.transformation
    );
  }
  return true;
};

// Le socle est toujours éligible, mais supplanté par n'importe quelle version datée déjà effective.
const compareMostRecentFirst = (
  first: OrderableVersion,
  second: OrderableVersion
): number => {
  if (first.effectiveDate === null || second.effectiveDate === null) {
    if (first.effectiveDate === second.effectiveDate) {
      return second.id - first.id;
    }
    return first.effectiveDate === null ? 1 : -1;
  }
  const dateDiff =
    second.effectiveDate.getTime() - first.effectiveDate.getTime();
  return dateDiff !== 0 ? dateDiff : second.id - first.id;
};

const isEligibleBefore = (
  version: OrderableVersion,
  cutoffMs: number
): boolean =>
  version.effectiveDate === null || version.effectiveDate.getTime() < cutoffMs;

const sortVersionsBefore = <TVersion extends OrderableVersion>(
  versions: TVersion[],
  cutoffMs: number
): TVersion[] =>
  versions
    .filter((version) => isEligibleBefore(version, cutoffMs))
    .sort(compareMostRecentFirst);

/* `sortVersionsBefore(...)[0]`, en un passage. */
export const pickVersionBefore = <TVersion extends OrderableVersion>(
  versions: TVersion[],
  cutoffMs: number
): TVersion | null => {
  let best: TVersion | null = null;

  for (const version of versions) {
    if (!isEligibleBefore(version, cutoffMs)) {
      continue;
    }
    if (best === null || compareMostRecentFirst(version, best) < 0) {
      best = version;
    }
  }

  return best;
};

const sortValidVersionsBefore = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  upperBoundMs: number
): TVersion[] =>
  sortVersionsBefore(versions.filter(isVersionValid), upperBoundMs);

export const getValidVersions = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  now: Date
): TVersion[] =>
  sortValidVersionsBefore(versions, startOfNextUtcDay(now).getTime());

export const resolveCurrentVersion = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  now: Date
): TVersion | undefined => getValidVersions(versions, now)[0];

// Afficher la version courante ou pour une structure dont la création est dans le futur la première version valide à venir.
export const resolveDisplayVersion = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  now: Date
): TVersion | undefined =>
  resolveCurrentVersion(versions, now) ??
  versions
    .filter(isVersionValid)
    .sort(
      (first, second) =>
        (first.effectiveDate?.getTime() ?? 0) -
        (second.effectiveDate?.getTime() ?? 0)
    )[0];

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
