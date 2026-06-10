import { describe, expect, it } from "vitest";

import { structureFinessesSchema } from "@/schemas/forms/base/finess.schema";

describe("structureFinessesSchema", () => {
  it("accepts distinct FINESS codes", () => {
    const result = structureFinessesSchema.safeParse({
      structureFinesses: [
        { description: "Site A", finess: { code: "123456789" } },
        { description: "Site B", finess: { code: "987654321" } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate FINESS codes", () => {
    const result = structureFinessesSchema.safeParse({
      structureFinesses: [
        { description: "Site A", finess: { code: "123456789" } },
        { description: "Doublon", finess: { code: "123456789" } },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Les codes FINESS doivent être uniques"
    );
  });

  it("ignores surrounding whitespace when comparing codes", () => {
    const result = structureFinessesSchema.safeParse({
      structureFinesses: [
        { finess: { code: "123456789" } },
        { finess: { code: " 123456789 " } },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts an empty list", () => {
    const result = structureFinessesSchema.safeParse({ structureFinesses: [] });

    expect(result.success).toBe(true);
  });
});
