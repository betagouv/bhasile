import { useForm, useFormContext } from "react-hook-form";

import { getYearRange } from "@/app/utils/date.util";
import {
  getCpomStructureIndexAndCpomMillesimeIndexForAYear,
  getMillesimendexForAYear,
} from "@/app/utils/structure.util";
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
      <td className="text-left">
        <strong>{label}</strong>
        <br />
        {subLabel}
      </td>
      {years.map((year) => (
        <td key={year}>
          <span className="flex items-center gap-2">
            <InputWithValidation
              name={getName(name, year, budgets, cpomStructures)}
              id={getName(name, year, budgets, cpomStructures)}
              control={control}
              type="number"
              min={0}
              label=""
              className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
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

export const isInputDisabled = (
  year: number,
  disabledYearsStart?: number,
  enabledYears?: number[],
  cpomStructures?: CpomStructureApiType[]
): boolean => {
  if (cpomStructures) {
    const { cpomStructureIndex, cpomMillesimeIndex } =
      getCpomStructureIndexAndCpomMillesimeIndexForAYear(cpomStructures, year);
    if (cpomStructureIndex === -1 || cpomMillesimeIndex === -1) {
      return true;
    }
  }
  if (disabledYearsStart) {
    return year >= disabledYearsStart;
  }
  if (enabledYears) {
    return !enabledYears.includes(year);
  }
  return false;
};

export const getName = (
  name: string,
  year: number,
  budgets?: BudgetApiType[],
  cpomStructures?: CpomStructureApiType[]
): string => {
  if (cpomStructures) {
    const { cpomStructureIndex, cpomMillesimeIndex } =
      getCpomStructureIndexAndCpomMillesimeIndexForAYear(cpomStructures, year);
    return `cpomStructures.${cpomStructureIndex}.cpom.cpomMillesimes.${cpomMillesimeIndex}.${name}`;
  }
  if (budgets) {
    return `budgets.${getMillesimendexForAYear(budgets, year)}.${name}`;
  }
  return "";
};

interface Props {
  name: string;
  label: string | React.ReactNode;
  subLabel?: string;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
}
