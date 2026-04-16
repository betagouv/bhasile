import { describe, expect, it } from "vitest";

import { decimalToNumber } from "@/app/utils/decimal.util";

describe("decimal util", () => {
  it("should return null for null/undefined", () => {
    expect(decimalToNumber(null)).toBe(null);
    expect(decimalToNumber(undefined)).toBe(null);
  });

  it("should return the number when given a number", () => {
    expect(decimalToNumber(0)).toBe(0);
    expect(decimalToNumber(0.42)).toBe(0.42);
  });

  it("should call toNumber when given a Decimal-like object", () => {
    const value = { toNumber: () => 0.75 };
    expect(decimalToNumber(value)).toBe(0.75);
  });
});

