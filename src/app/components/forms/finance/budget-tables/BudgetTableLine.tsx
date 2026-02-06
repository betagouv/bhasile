import { ReactNode } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";

import { BudgetTableLineInput } from "./BudgetTableLineInput";
import { BudgetTableStaticValue } from "./BudgetTableStaticValue";

export const BudgetTableLine = ({
  name,
  label,
  subLabel,
  colored,
  budgets,
  cpomStructures,
  cpomMillesimes,
  disabledYearsStart,
  enabledYears,
  canEdit = true,
}: Props) => {
  const parentFormContext = useFormContext();

  const localForm = useForm();

  const { control } = parentFormContext || localForm;

  const { years } = getYearRange({ order: "desc" });

  if (!budgets && !cpomStructures && !cpomMillesimes) {
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
            {canEdit ? (
              <BudgetTableLineInput
                name={name}
                year={year}
                control={control}
                budgets={budgets}
                cpomStructures={cpomStructures}
                cpomMillesimes={cpomMillesimes}
                disabledYearsStart={disabledYearsStart}
                enabledYears={enabledYears}
              />
            ) : (
              <BudgetTableStaticValue
                name={name}
                year={year}
                colored={colored}
                budgets={budgets}
                cpomStructures={cpomStructures}
                cpomMillesimes={cpomMillesimes}
                disabledYearsStart={disabledYearsStart}
                enabledYears={enabledYears}
              />
            )}
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
  colored?: boolean;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  cpomMillesimes?: CpomMillesimeApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
  canEdit?: boolean;
};
