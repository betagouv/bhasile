export const decimalToNumber = (
  value:
    | number
    | null
    | undefined
    | {
        toNumber: () => number;
      }
): number | null => {
  if (value == null) {
    return null;
  }
  return typeof value === "number" ? value : value.toNumber();
};
