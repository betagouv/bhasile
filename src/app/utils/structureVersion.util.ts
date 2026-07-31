export type OrderableStructureVersion = {
  id: number;
  effectiveDate: Date | null;
};

// Le socle (`effectiveDate` null) est toujours éligible, mais supplanté par
// n'importe quelle version datée déjà effective. À date égale, le plus grand `id`.
const compareMostRecentFirst = (
  first: OrderableStructureVersion,
  second: OrderableStructureVersion
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
  version: OrderableStructureVersion,
  cutoffMs: number
): boolean =>
  version.effectiveDate === null || version.effectiveDate.getTime() < cutoffMs;

export const sortStructureVersionsBefore = <
  TVersion extends OrderableStructureVersion,
>(
  versions: TVersion[],
  cutoffMs: number
): TVersion[] =>
  versions
    .filter((version) => isEligibleBefore(version, cutoffMs))
    .sort(compareMostRecentFirst);

/* `sortStructureVersionsBefore(...)[0]`, en un passage. */
export const pickStructureVersionBefore = <
  TVersion extends OrderableStructureVersion,
>(
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
