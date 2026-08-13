const isDecimal = (value: object): boolean =>
  "toNumber" in value &&
  typeof (value as { toNumber: unknown }).toNumber === "function" &&
  "s" in value &&
  "e" in value &&
  "d" in value;

export const recursivelySerializeForClient = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => recursivelySerializeForClient(item));
  }

  if (value && typeof value === "object") {
    if (isDecimal(value)) {
      return (value as { toJSON?: () => unknown }).toJSON?.() ?? String(value);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        recursivelySerializeForClient(nestedValue),
      ])
    );
  }

  return value;
};
