export type NumericAggregation = "moyenne" | "mediane";

export const average = (
  values: (number | null | undefined)[]
): number | null => {
  const valid = values.filter(
    (value): value is number => typeof value === "number"
  );
  if (valid.length === 0) {
    return null;
  }
  return (sumValues(valid) ?? 0) / valid.length;
};

export const median = (
  values: (number | null | undefined)[]
): number | null => {
  const valid = values
    .filter((value): value is number => typeof value === "number")
    .sort((valueA, valueB) => valueA - valueB);
  if (valid.length === 0) {
    return null;
  }
  const mid = Math.floor(valid.length / 2);
  if (valid.length % 2 === 0) {
    return (valid[mid - 1] + valid[mid]) / 2;
  }
  return valid[mid];
};

// Agrège des valeurs numériques (moyenne ou médiane)
export const aggregateValues = (
  values: (number | null | undefined)[],
  aggregation: NumericAggregation
): number | null =>
  aggregation === "mediane" ? median(values) : average(values);

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
    if (typeof weight !== "number" || typeof value !== "number") {
      continue;
    }
    sumWeight += weight;
    sumWeighted += weight * value;
  }

  return sumWeight === 0 ? null : sumWeighted / sumWeight;
};

export const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;
