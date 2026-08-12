import { describe, expect, it } from "vitest";

import {
  evaluationsAutoSaveSchema,
  evaluationsSchemaWithConditionalValidation,
} from "@/schemas/forms/base/evaluation.schema";

const parseEvaluation = (evaluation: Record<string, unknown>) =>
  evaluationsSchemaWithConditionalValidation.safeParse({
    evaluations: [{ fileUploads: [], ...evaluation }],
  });

describe("evaluationsSchemaWithConditionalValidation", () => {
  it("accepte une évaluation depuis 2022 dont les notes sont renseignées", () => {
    const result = parseEvaluation({
      date: "2024-11-29",
      notePersonne: 3.63,
      notePro: 3.77,
      noteStructure: 3.17,
      note: 3.52,
    });

    expect(result.success).toBe(true);
  });

  it("rejette une évaluation depuis 2022 dont les notes sont vides", () => {
    const result = parseEvaluation({
      date: "2024-11-29",
      notePersonne: null,
      notePro: null,
      noteStructure: null,
      note: null,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Les notes doivent être renseignées"
    );
  });

  it("rejette une note hors de l’échelle 1-4", () => {
    const result = parseEvaluation({
      date: "2024-11-29",
      notePersonne: 3.63,
      notePro: 3.77,
      noteStructure: 3.17,
      note: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Les notes doivent être comprises entre 1 et 4"
    );
  });

  it("accepte une évaluation antérieure à 2022 sans notes", () => {
    const result = parseEvaluation({
      date: "2019-06-12",
      notePersonne: null,
      notePro: null,
      noteStructure: null,
      note: null,
    });

    expect(result.success).toBe(true);
  });

  it("accepte des notes renseignées sur une évaluation antérieure à 2022", () => {
    const result = parseEvaluation({
      date: "2019-06-12",
      notePersonne: 3.63,
      notePro: 3.77,
      noteStructure: 3.17,
      note: 3.52,
    });

    expect(result.success).toBe(true);
  });

  it("rejette une note hors échelle même avant 2022", () => {
    const result = parseEvaluation({
      date: "2019-06-12",
      notePersonne: 0,
      notePro: 0,
      noteStructure: 0,
      note: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Les notes doivent être comprises entre 1 et 4"
    );
  });

  it("rattache l'erreur au champ concerné", () => {
    const result = parseEvaluation({
      date: "2024-11-29",
      notePersonne: 3.63,
      notePro: 3.77,
      noteStructure: 3.17,
      note: 0,
    });

    expect(result.error?.issues[0]?.path).toEqual(["evaluations", 0, "note"]);
  });
});

describe("evaluationsAutoSaveSchema", () => {
  it("tolère des notes vides en cours de saisie", () => {
    const result = evaluationsAutoSaveSchema.safeParse({
      evaluations: [{ date: "2024-11-29", notePersonne: 3.63 }],
    });

    expect(result.success).toBe(true);
  });

  it("rejette une note à 0 lors de la sauvegarde d'un brouillon", () => {
    const result = evaluationsAutoSaveSchema.safeParse({
      evaluations: [{ date: "2024-11-29", notePersonne: 0 }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Les notes doivent être comprises entre 1 et 4"
    );
  });
});
