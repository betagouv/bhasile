import { ReactNode } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { getName, isInputDisabled } from "@/app/utils/budget.util";
import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
<<<<<<< HEAD
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
=======
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
>>>>>>> origin/migration

import InputWithValidation from "../../InputWithValidation";

export const BudgetTableLine = ({
  name,
  label,
  subLabel,
  budgets,
  cpomStructures,
<<<<<<< HEAD
  cpomMillesimes,
=======
>>>>>>> origin/migration
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const parentFormContext = useFormContext();

  const localForm = useForm();

  const { control } = parentFormContext || localForm;

  const { years } = getYearRange({ order: "desc" });

<<<<<<< HEAD
  if (!budgets && !cpomStructures && !cpomMillesimes) {
=======
  if (!budgets && !cpomStructures) {
>>>>>>> origin/migration
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
<<<<<<< HEAD
              name={getName(
                name,
                year,
                budgets,
                cpomStructures,
                cpomMillesimes
              )}
              id={getName(name, year, budgets, cpomStructures, cpomMillesimes)}
=======
              name={getName(name, year, budgets, cpomStructures)}
              id={getName(name, year, budgets, cpomStructures)}
>>>>>>> origin/migration
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
<<<<<<< HEAD
  cpomMillesimes?: CpomMillesimeApiType[];
=======
>>>>>>> origin/migration
  disabledYearsStart?: number;
  enabledYears?: number[];
};
