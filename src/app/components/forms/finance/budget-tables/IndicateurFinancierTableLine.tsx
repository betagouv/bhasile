import { ReactNode } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { getEveryColumn } from "@/app/utils/indicateurFinancier.util";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";

import { BudgetTableLineInput } from "./BudgetTableLineInput";
import { BudgetTableLineLabel } from "./BudgetTableLineLabel";
import { BudgetTableStaticValue } from "./BudgetTableStaticValue";

export const IndicateurFinancierTableLine = ({
  name,
  label,
  subLabel,
  indicateursFinanciers,
  years,
  canEdit = true,
  isCurrency = true,
}: Props) => {
  const parentFormContext = useFormContext();

  const localForm = useForm();

  const { control } = parentFormContext || localForm;

  if (!indicateursFinanciers) {
    return null;
  }

  const everyColumns = getEveryColumn(canEdit, indicateursFinanciers, years);

  return (
    <tr>
      <BudgetTableLineLabel label={label} subLabel={subLabel} />
      {years.map((year, index) =>
        everyColumns[index].map((type) => (
          <td
            key={year + type}
            className={cn(
              "border-default-grey",
              type === "REALISE" ? "border-r" : "border-l",
              index === 0 && "border-l"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {canEdit ? (
                <BudgetTableLineInput
                  name={name}
                  year={year}
                  type={type}
                  control={control}
                  indicateursFinanciers={indicateursFinanciers}
                  isCurrency={isCurrency}
                />
              ) : (
                <BudgetTableStaticValue
                  name={name}
                  year={year}
                  type={type}
                  indicateursFinanciers={indicateursFinanciers}
                  isCurrency={isCurrency}
                />
              )}
            </span>
          </td>
        ))
      )}
    </tr>
  );
};

type Props = {
  name: string;
  label: string | ReactNode;
  subLabel?: string;
  indicateursFinanciers?: IndicateurFinancierApiType[];
  years: number[];
  canEdit?: boolean;
  isCurrency?: boolean;
};
