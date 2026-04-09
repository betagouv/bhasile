import { ReactNode } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { BudgetTableLineInput } from "./BudgetTableLineInput";
import { BudgetTableStaticValue } from "./BudgetTableStaticValue";

export const BudgetTableLine = ({
  type,
  name,
  label,
  subLabel,
  colored,
  budgets,
  cpomStructures,
  years,
  disabledYearsStart,
  enabledYears,
  canEdit = true,
}: Props) => {
  const parentFormContext = useFormContext();

  const localForm = useForm();

  const { control } = parentFormContext || localForm;

  if (!budgets && !cpomStructures) {
    return null;
  }

  return (
    <tr>
      <td className="text-left! w-[220]">
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
                disabledYearsStart={disabledYearsStart}
                enabledYears={enabledYears}
                type={type}
              />
            ) : (
              <BudgetTableStaticValue
                name={name}
                year={year}
                colored={colored}
                budgets={budgets}
                cpomStructures={cpomStructures}
                disabledYearsStart={disabledYearsStart}
                enabledYears={enabledYears}
                type={type}
              />
            )}
          </span>
        </td>
      ))}
    </tr>
  );
};

type Props = {
  type?: StructureType;
  name: string;
  label: string | ReactNode;
  subLabel?: string;
  colored?: boolean;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  years: number[];
  disabledYearsStart?: number;
  enabledYears?: number[];
  canEdit?: boolean;
};
