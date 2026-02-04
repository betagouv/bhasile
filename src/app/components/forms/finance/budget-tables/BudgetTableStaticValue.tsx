import { EmptyCell } from "@/app/components/common/EmptyCell";
import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { isInputDisabled } from "@/app/utils/budget.util";
import {
  getCpomStructureIndexAndCpomMillesimeIndexForAYear,
  getMillesimeIndexForAYear,
} from "@/app/utils/structure.util";
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
            budgets[getMillesimeIndexForAYear(budgets, year)]?.[
              name as keyof BudgetApiType
            ]
          }
          type="currency"
        />
      </span>
    );
  }

  if (cpomStructures) {
    const { cpomStructureIndex, cpomMillesimeIndex } =
      getCpomStructureIndexAndCpomMillesimeIndexForAYear(cpomStructures, year);

    if (cpomStructureIndex === -1 || cpomMillesimeIndex === -1) {
      return <EmptyCell />;
    }

    return (
      <span className="text-center">
        <NumberDisplay
          value={
            cpomStructures[cpomStructureIndex]?.cpom?.cpomMillesimes?.[
              cpomMillesimeIndex
            ]?.[name as keyof CpomMillesimeApiType]
          }
          type="currency"
        />
      </span>
    );
  }

  if (cpomMillesimes) {
    return (
      <span className="text-center">
        <NumberDisplay
          value={
            cpomMillesimes[getMillesimeIndexForAYear(cpomMillesimes, year)]?.[
              name as keyof CpomMillesimeApiType
            ]
          }
        />
      </span>
    );
  }

  return <EmptyCell />;
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
