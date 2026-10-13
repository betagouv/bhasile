import { describe, expect, it } from "vitest";

import {
  getEvaluationNote,
  getEvaluationsDefaultValues,
  transformFormEvaluationsToApiEvaluations,
} from "@/app/utils/evaluation.util";
import { EvaluationFormValues } from "@/schemas/forms/base/evaluation.schema";

const evaluation = (
  date: string,
  notes: Partial<EvaluationFormValues> = {}
): EvaluationFormValues =>
  ({
    date,
    notePersonne: 3.63,
    notePro: 3.77,
    noteStructure: 3.17,
    fileUploads: [{ id: 1, key: "rapport.pdf" }],
    ...notes,
  }) as EvaluationFormValues;

describe("getEvaluationsDefaultValues", () => {
  it("laisse les notes absentes à null plutôt que de les ramener à 0", () => {
    const [defaultValues] = getEvaluationsDefaultValues(
      [{ id: 1, date: "2019-06-12T12:00:00.000Z" }],
      true
    )!;

    expect(defaultValues).toMatchObject({
      notePersonne: null,
      notePro: null,
      noteStructure: null,
    });
  });
});

describe("transformFormEvaluationsToApiEvaluations", () => {
  it("conserve les notes d'une évaluation depuis 2022", () => {
    const [apiEvaluation] = transformFormEvaluationsToApiEvaluations([
      evaluation("2024-11-29T12:00:00.000Z"),
    ])!;

    expect(apiEvaluation).toMatchObject({
      notePersonne: 3.63,
      notePro: 3.77,
      noteStructure: 3.17,
    });
  });

  it("conserve les notes d'une évaluation antérieure à 2022", () => {
    const [apiEvaluation] = transformFormEvaluationsToApiEvaluations([
      evaluation("2019-06-12T12:00:00.000Z"),
    ])!;

    expect(apiEvaluation).toMatchObject({
      notePersonne: 3.63,
      notePro: 3.77,
      noteStructure: 3.17,
    });
  });
});

describe("getEvaluationNote", () => {
  it("calcule la moyenne des trois notes arrondie à deux décimales", () => {
    expect(
      getEvaluationNote({
        notePersonne: 3.63,
        notePro: 3.77,
        noteStructure: 3.17,
      })
    ).toBe(3.52);
  });

  it("renvoie null dès qu'une des trois notes est absente", () => {
    expect(
      getEvaluationNote({
        notePersonne: 3.63,
        notePro: null,
        noteStructure: 3.17,
      })
    ).toBeNull();
  });
});
