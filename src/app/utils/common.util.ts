export const sortKeysByValue = (
  object: Record<string, number>
): Record<string, number> => {
  return Object.entries(object)
    .sort(([, firstValue], [, secondValue]) => secondValue - firstValue)
    .reduce(
      (accumulator, [key, value]) => ({
        ...accumulator,
        [key]: value,
      }),
      {}
    );
};

export const getPercentage = (
  partialValue: number,
  totalValue: number
): string => {
  const percentage = (partialValue / totalValue) * 100;
  if (percentage < 1) {
    return "< 1%";
  } else {
    return `${Math.floor(percentage)}%`;
  }
};

export const computeAverage = (array: (number | null)[]): number => {
  if (array.length === 0) {
    return 0;
  }
  const arrayWithoutNullValues = array.filter((element) => element !== null);
  if (arrayWithoutNullValues.length === 0) {
    return 0;
  }
  return (
    arrayWithoutNullValues.reduce(
      (firstElement, secondElement) => firstElement + secondElement
    ) / arrayWithoutNullValues.length
  );
};

export const reverseObjectKeyValues = (
  objectToReverse: Record<string | number, string | number>
) => {
  const reversedObject: Record<string | number, string | number> = {};
  for (const key in objectToReverse) {
    reversedObject[objectToReverse[key]] = key;
  }
  return reversedObject;
};

export const convertObjectToArray = (
  objectToConvert: Record<string | number, string | number>
) => {
  const convertedArray = [];
  for (const key in objectToConvert) {
    convertedArray.push(objectToConvert[key]);
  }
  return convertedArray;
};

export const isNullOrUndefined = (value: unknown): boolean => {
  return value === undefined || value === null;
};
