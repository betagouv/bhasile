import { Badge } from "@/app/components/common/Badge";
import { EmptyCell } from "@/app/components/common/EmptyCell";
import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { isInputDisabled } from "@/app/utils/budget.util";
import { isNullOrUndefined } from "@/app/utils/common.util";
import {
  getCpomStructureIndexAndBudgetIndexForAYearAndAType,
  getMillesimeIndexForAYear,
} from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

export const BudgetTableStaticValue = ({
  type,
  name,
  year,
  colored,
  budgets,
  cpomStructures,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const isDisabled = isInputDisabled(
    year,
    type,
    disabledYearsStart,
    enabledYears,
    cpomStructures
  );

  let value: string | number | undefined | null;

  if (budgets) {
    value =
      budgets[getMillesimeIndexForAYear(budgets, year, type)]?.[
        name as keyof BudgetApiType
      ];
  }

  if (cpomStructures) {
    const { cpomStructureIndex, budgetIndex } =
      getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        year,
        type
      );

    value =
      cpomStructures[cpomStructureIndex]?.cpom?.budgets?.[budgetIndex]?.[
        name as keyof BudgetApiType
      ];
  }

  if (isDisabled || isNullOrUndefined(value)) {
    return <EmptyCell />;
  }

  return (
    <span className="text-center">
      {colored ? (
        <Badge type={Number(value) >= 0 ? "success" : "error"}>
          <NumberDisplay value={value} type="currency" className="text-sm" />
        </Badge>
      ) : (
        <NumberDisplay value={value} type="currency" />
      )}
    </span>
  );
};

type Props = {
  type?: StructureType;
  name: string;
  year: number;
  colored?: boolean;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
};
