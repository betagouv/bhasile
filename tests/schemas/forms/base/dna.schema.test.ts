import { describe, expect, it } from "vitest";

import {
  dnaStructuresAutoSaveSchema,
  dnaStructuresSchema,
} from "@/schemas/forms/base/dna.schema";

describe("dnaStructuresSchema", () => {
  it("accepts distinct DNA codes", () => {
    const result = dnaStructuresSchema.safeParse({
      dnaStructures: [{ dna: { code: "C-001" } }, { dna: { code: "H-002" } }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate DNA codes", () => {
    const result = dnaStructuresSchema.safeParse({
      dnaStructures: [{ dna: { code: "C-001" } }, { dna: { code: "C-001" } }],
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.map((issue) => issue.message)
    ).toContain("Les codes DNA doivent être uniques");
  });
});

describe("dnaStructuresAutoSaveSchema", () => {
  it("rejects duplicate DNA codes while saving a draft", () => {
    const result = dnaStructuresAutoSaveSchema.safeParse({
      dnaStructures: [{ dna: { code: "C-001" } }, { dna: { code: "C-001" } }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Les codes DNA doivent être uniques"
    );
  });

  it("tolerates blank or incomplete rows being filled in", () => {
    const result = dnaStructuresAutoSaveSchema.safeParse({
      dnaStructures: [{ dna: { code: "C-001" } }, { dna: {} }, {}],
    });

    expect(result.success).toBe(true);
  });
});
