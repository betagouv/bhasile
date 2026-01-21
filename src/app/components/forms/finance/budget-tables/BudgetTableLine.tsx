import { ReactNode } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { getName, isInputDisabled } from "@/app/utils/budget.util";
import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";

import InputWithValidation from "../../InputWithValidation";

export const BudgetTableLine = ({
  name,
  label,
  subLabel,
  budgets,
  cpomStructures,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const parentFormContext = useFormContext();

  const localForm = useForm();

  const { control } = parentFormContext || localForm;

  const { years } = getYearRange({ order: "desc" });

  if (!budgets && !cpomStructures) {
    return null;
  }

  return (
    <tr>
      <td className="text-left!">
        <strong className="whitespace-nowrap">{label}</strong>
        <br />
        <span className="text-xs">{subLabel}</span>
      </td>
      {years.map((year) => (
        <td key={year}>
          <span className="flex items-center justify-center gap-2">
            <InputWithValidation
              name={getName(name, year, budgets, cpomStructures)}
              id={getName(name, year, budgets, cpomStructures)}
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
            &nbsp;€
          </span>
        </td>
      ))}
    </tr>
  );
};

type Props = {
  name: string;
  label: string | ReactNode;
  subLabel?: string;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
};
