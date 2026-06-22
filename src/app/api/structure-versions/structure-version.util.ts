import { startOfNextUtcDay } from "@/app/utils/date.util";

type ResolvableVersion = {
  id: number;
  effectiveDate: Date;
  structureVersionTransformationId: number | null;
  structureVersionTransformation:
    | {
        transformation: { form: { status: boolean | null } | null } | null;
      }
    | null;
};

const isVersionValid = (version: ResolvableVersion): boolean => {
  if (version.structureVersionTransformationId === null) {
    return true;
  }
  return (
    version.structureVersionTransformation?.transformation?.form?.status ===
    true
  );
};

const resolveLatestValidBefore = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  upperBoundMs: number
): TVersion | undefined =>
  versions
    .filter(
      (version) =>
        version.effectiveDate.getTime() < upperBoundMs &&
        isVersionValid(version)
    )
    .sort((first, second) => {
      const dateDiff =
        second.effectiveDate.getTime() - first.effectiveDate.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return second.id - first.id;
    })[0];

export const resolveCurrentVersion = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  now: Date
): TVersion | undefined =>
  resolveLatestValidBefore(versions, startOfNextUtcDay(now).getTime());

export const resolvePredecessor = <TVersion extends ResolvableVersion>(
  versions: TVersion[],
  effectiveDate: Date
): TVersion | undefined =>
  resolveLatestValidBefore(versions, effectiveDate.getTime());
