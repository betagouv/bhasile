import { describe, expect, it } from "vitest";

import {
  structureFinessesAutoSaveSchema,
  structureFinessesSchema,
} from "@/schemas/forms/base/finess.schema";

describe("structureFinessesSchema", () => {
  it("accepte des codes FINESS distincts", () => {
    const result = structureFinessesSchema.safeParse({
      structureFinesses: [
        { description: "Site A", finess: { code: "123456789" } },
        { description: "Site B", finess: { code: "987654321" } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejette des codes FINESS en doublon", () => {
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

  it("ignore les espaces autour des codes lors de la comparaison", () => {
    const result = structureFinessesSchema.safeParse({
      structureFinesses: [
        { finess: { code: "123456789" } },
        { finess: { code: " 123456789 " } },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepte une liste vide", () => {
    const result = structureFinessesSchema.safeParse({ structureFinesses: [] });

    expect(result.success).toBe(true);
  });
});

describe("structureFinessesAutoSaveSchema", () => {
  it("rejette des codes FINESS en doublon lors de la sauvegarde d'un brouillon", () => {
    const result = structureFinessesAutoSaveSchema.safeParse({
      structureFinesses: [
        { finess: { code: "123456789" } },
        { finess: { code: "123456789" } },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Les codes FINESS doivent être uniques"
    );
  });

  it("tolère des lignes vides ou incomplètes en cours de saisie", () => {
    const result = structureFinessesAutoSaveSchema.safeParse({
      structureFinesses: [
        { finess: { code: "123456789" } },
        { finess: {} },
        {},
      ],
    });

    expect(result.success).toBe(true);
  });
});
