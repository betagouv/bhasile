import { Control, FieldValues } from "react-hook-form";

import { getName, isInputDisabled } from "@/app/utils/budget.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

import InputWithValidation from "../../InputWithValidation";

export const BudgetTableLineInput = ({
  type,
  name,
  year,
  control,
  budgets,
  cpomStructures,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  return (
    <>
      <InputWithValidation
        name={getName(name, year, type, budgets, cpomStructures)}
        id={getName(name, year, type, budgets, cpomStructures)}
        control={control}
        type="number"
        min={0}
        label=""
        className="mb-0 items-center [&_p]:hidden [&_input]:w-full"
        variant="simple"
        disabled={isInputDisabled(
          year,
          type,
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
  type?: StructureType;
  name: string;
  year: number;
  control: Control<FieldValues>;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
};
