import { useEffect } from "react";
import { FieldValues, UseFormSetValue } from "react-hook-form";

import { getBudgetDetailPathsToClear } from "@/app/utils/budget.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { StructureType } from "@/types/structure.type";

export const useClearAffectationDetails = (
  budgets: BudgetApiType[],
  setValue: UseFormSetValue<FieldValues>,
  type?: StructureType
) => {
  const pathsKey = getBudgetDetailPathsToClear(budgets, type).join("|");

  useEffect(() => {
    if (!pathsKey) {
      return;
    }
    pathsKey
      .split("|")
      .forEach((path) => setValue(path, null, { shouldValidate: true }));
  }, [pathsKey, setValue]);
};
