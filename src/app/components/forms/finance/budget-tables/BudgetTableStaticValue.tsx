import { isInputDisabled } from "@/app/utils/budget.util";
import { formatCurrency } from "@/app/utils/number.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";

export const BudgetTableStaticValue = ({
  name,
  year,
  budgets,
  cpomStructures,
  cpomMillesimes,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const isDisabled = isInputDisabled(
    year,
    disabledYearsStart,
    enabledYears,
    cpomStructures
  );
  return isDisabled ? (
    "-"
  ) : (
    <span className="text-center">
      {formatCurrency(
        budgets?.find((budget) => budget.year === year)?.[
          name as keyof BudgetApiType
        ] || 0
      )}
    </span>
  );
};

type Props = {
  name: string;
  year: number;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  cpomMillesimes?: CpomMillesimeApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
};
