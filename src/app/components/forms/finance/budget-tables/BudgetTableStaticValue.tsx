import { Badge } from "@/app/components/common/Badge";
import { EmptyCell } from "@/app/components/common/EmptyCell";
import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { isInputDisabled } from "@/app/utils/budget.util";
import { isNullOrUndefined } from "@/app/utils/common.util";
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

  let value: string | number | undefined | null;

  if (budgets) {
    value =
      budgets[getMillesimeIndexForAYear(budgets, year)]?.[
        name as keyof BudgetApiType
      ];
  }

  if (cpomStructures) {
    const { cpomStructureIndex, cpomMillesimeIndex } =
      getCpomStructureIndexAndCpomMillesimeIndexForAYear(cpomStructures, year);

    value =
      cpomStructures[cpomStructureIndex]?.cpom?.cpomMillesimes?.[
        cpomMillesimeIndex
      ]?.[name as keyof CpomMillesimeApiType];
  }

  if (cpomMillesimes) {
    value =
      cpomMillesimes[getMillesimeIndexForAYear(cpomMillesimes, year)]?.[
        name as keyof CpomMillesimeApiType
      ];
  }

  if (isDisabled || isNullOrUndefined(value)) {
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
