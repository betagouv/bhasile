export const sumValues = (
  values: Array<number | null | undefined>
): number | null => {
  let acc = 0;
  let isNotNull = false;
  for (const v of values) {
    if (typeof v === "number") {
      acc += v;
      isNotNull = true;
    }
  }
  return isNotNull ? acc : null;
};

export const weightedAverage = (
  pairs: Array<{ weight: number | null | undefined; value: number | null }>
): number | null => {
  let sumWeight = 0;
  let sumWeighted = 0;

  for (const { weight, value } of pairs) {
    if (typeof weight !== "number" || typeof value !== "number") {continue;}
    sumWeight += weight;
    sumWeighted += weight * value;
  }

  return sumWeight === 0 ? null : sumWeighted / sumWeight;
};
