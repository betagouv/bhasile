import { describe, expect, it } from "vitest";

import { evaluationsSchemaWithConditionalValidation } from "@/schemas/forms/base/evaluation.schema";

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

  it("rejette une note à 0", () => {
    const result = parseEvaluation({
      date: "2024-11-29",
      notePersonne: 3.63,
      notePro: 3.77,
      noteStructure: 3.17,
      note: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Les notes doivent être supérieures à 0"
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

  it("rejette une note à 0 sur une évaluation antérieure à 2022", () => {
    const result = parseEvaluation({
      date: "2019-06-12",
      notePersonne: 0,
      notePro: 0,
      noteStructure: 0,
      note: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Les notes doivent être supérieures à 0"
    );
  });
});
