import { describe, expect, it } from "vitest";

import { zSafePositiveDecimalsNullish } from "@/app/utils/zodCustomFields";

const parse = (value: unknown) =>
  zSafePositiveDecimalsNullish().parse(value) as number | null | undefined;

describe("zSafePositiveDecimalsNullish", () => {
  it("renvoie null pour une chaîne vide", () => {
    expect(parse("")).toBeNull();
  });

  it.each([" ", "   ", " ", "\t"])(
    "renvoie null pour une chaîne qui ne contient que des blancs (%j)",
    (value) => {
      expect(parse(value)).toBeNull();
    }
  );

  it("parse un nombre formaté par NumericFormat", () => {
    expect(parse("12 345,67")).toBe(12345.67);
  });

  it("parse un décimal à séparateur français", () => {
    expect(parse("0,5")).toBe(0.5);
  });

  it("conserve un zéro réellement saisi", () => {
    expect(parse("0")).toBe(0);
  });

  it("laisse passer undefined", () => {
    expect(parse(undefined)).toBeUndefined();
  });
});
