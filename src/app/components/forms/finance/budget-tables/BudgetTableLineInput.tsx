import { Control, FieldValues } from "react-hook-form";

import { getName, isInputDisabled } from "@/app/utils/budget.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";

import InputWithValidation from "../../InputWithValidation";

export const BudgetTableLineInput = ({
  name,
  year,
  control,
  budgets,
  cpomStructures,
  cpomMillesimes,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  return (
    <>
      <InputWithValidation
        name={getName(name, year, budgets, cpomStructures, cpomMillesimes)}
        id={getName(name, year, budgets, cpomStructures, cpomMillesimes)}
        control={control}
        type="number"
        min={0}
        label=""
        className="mb-0 items-center [&_p]:hidden [&_input]:w-full"
        variant="simple"
        disabled={isInputDisabled(
          year,
          disabledYearsStart,
          enabledYears,
          cpomStructures
        )}
      />
      €
    </>
  );
};

type Props = {
  name: string;
  year: number;
  control: Control<FieldValues>;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  cpomMillesimes?: CpomMillesimeApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
};
