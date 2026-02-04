import { Badge } from "@/app/components/common/Badge";
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
  colored,
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

    const value =
      cpomStructures[cpomStructureIndex]?.cpom?.cpomMillesimes?.[
        cpomMillesimeIndex
      ]?.[name as keyof CpomMillesimeApiType];

    if (!value) {
      return <EmptyCell />;
    }

    return (
      <span className="text-center">
        {colored ? (
          <Badge type={Number(value) >= 0 ? "success" : "error"}>
            <NumberDisplay value={value} type="currency" />
          </Badge>
        ) : (
          <NumberDisplay value={value} type="currency" />
        )}
      </span>
    );
  }
  console.log(colored);
  if (cpomMillesimes) {
    const value =
      cpomMillesimes[getMillesimeIndexForAYear(cpomMillesimes, year)]?.[
        name as keyof CpomMillesimeApiType
      ];

    if (!value) {
      return <EmptyCell />;
    }

    return (
      <span className="text-center">
        {colored ? (
          <Badge type={Number(value) >= 0 ? "success" : "error"}>
            <NumberDisplay value={value} type="currency" />
          </Badge>
        ) : (
          <NumberDisplay value={value} type="currency" />
        )}
      </span>
    );
  }

  return <EmptyCell />;
};

type Props = {
  name: string;
  year: number;
  colored?: boolean;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  cpomMillesimes?: CpomMillesimeApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
};
