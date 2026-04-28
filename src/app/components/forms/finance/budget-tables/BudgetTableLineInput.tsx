import { Control, FieldValues } from "react-hook-form";

import { getName, isInputDisabled } from "@/app/utils/budget.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiWrite } from "@/schemas/api/cpom.schema";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { IndicateurFinancierType } from "@/types/indicateur-financier.type";
import { StructureType } from "@/types/structure.type";

import InputWithValidation from "../../InputWithValidation";

export const BudgetTableLineInput = ({
  type,
  name,
  year,
  control,
  budgets,
  indicateursFinanciers,
  cpomStructures,
  disabledYearsStart,
  enabledYears,
  isCurrency = true,
}: Props) => {
  return (
    <>
      <InputWithValidation
        name={getName(
          name,
          year,
          type,
          budgets,
          cpomStructures,
          indicateursFinanciers
        )}
        id={getName(
          name,
          year,
          type,
          budgets,
          cpomStructures,
          indicateursFinanciers
        )}
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
      {isCurrency ? "€" : ""}
    </>
  );
};

type Props = {
  type?: StructureType | IndicateurFinancierType;
  name: string;
  year: number;
  control: Control<FieldValues>;
  budgets?: BudgetApiType[];
  indicateursFinanciers?: IndicateurFinancierApiType[];
  cpomStructures?: CpomStructureApiWrite[];
  disabledYearsStart?: number;
  enabledYears?: number[];
  isCurrency?: boolean;
};
