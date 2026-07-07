import { describe, expect, it } from "vitest";

import {
  dnaStructuresAutoSaveSchema,
  dnaStructuresSchema,
} from "@/schemas/forms/base/dna.schema";

describe("dnaStructuresSchema", () => {
  it("accepte des codes DNA distincts", () => {
    const result = dnaStructuresSchema.safeParse({
      dnaStructures: [{ dna: { code: "C-001" } }, { dna: { code: "H-002" } }],
    });

    expect(result.success).toBe(true);
  });

  it("rejette des codes DNA en doublon", () => {
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
  it("rejette des codes DNA en doublon lors de la sauvegarde d'un brouillon", () => {
    const result = dnaStructuresAutoSaveSchema.safeParse({
      dnaStructures: [{ dna: { code: "C-001" } }, { dna: { code: "C-001" } }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Les codes DNA doivent être uniques"
    );
  });

  it("tolère des lignes vides ou incomplètes en cours de saisie", () => {
    const result = dnaStructuresAutoSaveSchema.safeParse({
      dnaStructures: [{ dna: { code: "C-001" } }, { dna: {} }, {}],
    });

    expect(result.success).toBe(true);
  });
});
