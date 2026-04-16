import { Prisma } from "@/generated/prisma/client";

export const decimalToNumber = (
  value: Prisma.Decimal | number | null | undefined
): number | null => {
  if (value == null) return null;
  return typeof value === "number" ? value : value.toNumber();
};
