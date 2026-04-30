import { EvaluationApiType } from "@/schemas/api/evaluation.schema";

export const createEvaluation = ({
  id,
  date,
}: CreateEvaluationArgs): EvaluationApiType => {
  return {
    id: id ?? 1,
    structureDnaCode: "C0001",
    date: date ?? new Date("2022-01-02").toISOString(),
    note: 4,
    notePersonne: 4,
    notePro: 4,
    noteStructure: 4,
    fileUploads: [],
  };
};

type CreateEvaluationArgs = {
  id?: number;
  date?: string;
};
