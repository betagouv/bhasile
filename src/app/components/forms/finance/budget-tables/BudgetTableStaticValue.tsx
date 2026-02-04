import { EmptyCell } from "@/app/components/common/EmptyCell";
import { NumberDisplay } from "@/app/components/common/NumberDisplay";
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
  if (isDisabled) {
    return <EmptyCell />;
  }

  if (budgets) {
    return (
      <span className="text-center">
        <NumberDisplay
          value={
            budgets?.find((budget) => budget.year === year)?.[
              name as keyof BudgetApiType
            ] || 0
          }
          type="currency"
        />
      </span>
    );
  }
  return <span className="text-center">-</span>;
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
