import { FinessApiType } from "@/schemas/api/finess.schema";
import { FinessFormValues } from "@/schemas/forms/base/finess.schema";

export const transformApiFinessesToFormFinesses = (
  finesses?: FinessApiType[]
): FinessFormValues[] | undefined => {
  return finesses?.map((finess) => ({
    ...finess,
    code: finess.code,
    description: finess.description ?? undefined,
  }));
};
