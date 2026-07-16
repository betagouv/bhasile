import { FocusEvent, ReactNode } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { getName } from "@/app/utils/budget.util";
import { parseFrenchNumber } from "@/app/utils/number.util";
import { AFFECTATION_DETAIL_FIELDS } from "@/config/budget.config";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiWrite } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { BudgetTableLineInput } from "./BudgetTableLineInput";
import { BudgetTableLineLabel } from "./BudgetTableLineLabel";
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

  const { control, setValue } = parentFormContext || localForm;

  if (!budgets && !cpomStructures) {
    return null;
  }

  const shouldClearAffectationDetails =
    name === "affectationReservesFondsDedies" && Boolean(budgets);

  const clearAffectationDetailsOnBlur = (
    year: number,
    event: FocusEvent<HTMLSpanElement>
  ) => {
    const affectation = parseFrenchNumber(
      (event.target as HTMLInputElement).value
    );
    if (affectation !== 0 && affectation !== null) {
      return;
    }
    AFFECTATION_DETAIL_FIELDS.forEach((detailField) =>
      setValue(getName(detailField, year, type, budgets), null, {
        shouldValidate: true,
      })
    );
  };

  return (
    <tr>
      <BudgetTableLineLabel label={label} subLabel={subLabel} />

      {years.map((year) => (
        <td key={year}>
          <span
            className="flex items-center justify-center gap-2"
            onBlur={
              shouldClearAffectationDetails
                ? (event) => clearAffectationDetailsOnBlur(year, event)
                : undefined
            }
          >
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
  cpomStructures?: CpomStructureApiWrite[];
  years: number[];
  disabledYearsStart?: number;
  enabledYears?: number[];
  canEdit?: boolean;
};
