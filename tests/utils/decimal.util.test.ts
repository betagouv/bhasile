import { describe, expect, it } from "vitest";

import { decimalToNumber } from "@/app/utils/decimal.util";

describe("decimal util", () => {
  it("retourne null pour null/undefined", () => {
    expect(decimalToNumber(null)).toBe(null);
    expect(decimalToNumber(undefined)).toBe(null);
  });

  it("retourne le nombre quand on passe un nombre", () => {
    expect(decimalToNumber(0)).toBe(0);
    expect(decimalToNumber(0.42)).toBe(0.42);
  });

  it("appelle toNumber quand on passe un objet de type Decimal", () => {
    const value = { toNumber: () => 0.75 };
    expect(decimalToNumber(value)).toBe(0.75);
  });
});

