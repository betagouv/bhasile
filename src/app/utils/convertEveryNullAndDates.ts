/**
 * Recursively converts every `null` and `undefined` value to `undefined`, and every `Date` to ISO string.
 * Handles nested objects and arrays. Leaves RegExp and other built-in objects unchanged.
 */
export function convertEveryNullAndDates<T>(value: T): T {
  if (value === null || value === undefined) {
    return undefined as T;
  }

  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => convertEveryNullAndDates(item)) as unknown as T;
  }

  if (
    typeof value === "object" &&
    Object.prototype.toString.call(value) === "[object Object]"
  ) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = convertEveryNullAndDates(val);
    }
    return result as T;
  }

  return value;
}
