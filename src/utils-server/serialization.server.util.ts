import { Prisma } from "@/generated/prisma/client";

export const recursivelySerializeForClient = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Prisma.Decimal) {
    return value.toJSON();
  }

  if (Array.isArray(value)) {
    return value.map((item) => recursivelySerializeForClient(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        recursivelySerializeForClient(nestedValue),
      ])
    );
  }

  return value;
};
