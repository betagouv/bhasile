import { describe, expect, it } from "vitest";

import { zSafePositiveDecimalsNullish } from "@/app/utils/zodCustomFields";

const parse = (value: unknown) =>
  zSafePositiveDecimalsNullish().parse(value) as number | null | undefined;

describe("zSafePositiveDecimalsNullish", () => {
  it("renvoie null pour une chaîne vide ou uniquement composée de blancs", () => {
    expect(parse("")).toBeNull();
    expect(parse("   ")).toBeNull();
    expect(parse(" ")).toBeNull();
    expect(parse("\t")).toBeNull();
  });

  it("parse les nombres saisis au format français", () => {
    expect(parse("12 345,67")).toBe(12345.67);
    expect(parse("0,5")).toBe(0.5);
    expect(parse("0")).toBe(0);
  });

  it("laisse passer undefined", () => {
    expect(parse(undefined)).toBeUndefined();
  });
});
