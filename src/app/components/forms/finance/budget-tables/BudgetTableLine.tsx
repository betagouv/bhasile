import { useForm, useFormContext } from "react-hook-form";

import { getYearRange } from "@/app/utils/date.util";
import { getTypologieIndexForAYear } from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { Granularity } from "@/types/document-financier";

import InputWithValidation from "../../InputWithValidation";

const SCOPE = {
  [Granularity.STRUCTURE]: "budgets",
  [Granularity.CPOM]: "cpomMillesimes",
};
export const BudgetTableLine = ({
  name,
  label,
  subLabel,
  budgets,
  granularity,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const parentFormContext = useFormContext();

  const localForm = useForm();

  const { control } = parentFormContext || localForm;

  const { years } = getYearRange({ order: "desc" });

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
              name={`${SCOPE[granularity]}.${getTypologieIndexForAYear(budgets, year)}.${name}`}
              id={`gestionBudgetaire.${getTypologieIndexForAYear(budgets, year)}.${name}`}
              control={control}
              type="number"
              min={0}
              label=""
              className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
              variant="simple"
              disabled={
                enabledYears
                  ? !enabledYears.includes(year)
                  : disabledYearsStart
                    ? year >= disabledYearsStart
                    : false
              }
            />
            &nbsp;€
          </span>
        </td>
      ))}
    </tr>
  );
};

interface Props {
  name: string;
  label: string | React.ReactNode;
  subLabel?: string;
  budgets: BudgetApiType[];
  granularity: Granularity.CPOM | Granularity.STRUCTURE;
  disabledYearsStart?: number;
  enabledYears?: number[];
}
