import { ReactNode } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { isYearRealisee } from "@/app/utils/indicateurFinancier.util";
import { INDICATEUR_FINANCIER_CUTOFF_YEAR } from "@/constants";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { IndicateurFinancierType } from "@/types/indicateur-financier.type";

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

  const everyColumns = canEdit
    ? years.map((year) =>
        year >= INDICATEUR_FINANCIER_CUTOFF_YEAR
          ? (["PREVISIONNEL", "REALISE"] as IndicateurFinancierType[])
          : (["REALISE"] as IndicateurFinancierType[])
      )
    : years.map((year) => {
        return [
          isYearRealisee(indicateursFinanciers, year)
            ? "REALISE"
            : "PREVISIONNEL",
        ] as IndicateurFinancierType[];
      });

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
