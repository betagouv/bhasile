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
import { CpomStructureApiWrite } from "@/schemas/api/cpom.schema";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { IndicateurFinancierType } from "@/types/indicateur-financier.type";
import { StructureType } from "@/types/structure.type";

export const BudgetTableStaticValue = ({
  type,
  name,
  year,
  colored,
  budgets,
  indicateursFinanciers,
  cpomStructures,
  disabledYearsStart,
  enabledYears,
  isCurrency = true,
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

  if (indicateursFinanciers) {
    value =
      indicateursFinanciers[
        getMillesimeIndexForAYear(indicateursFinanciers, year, type)
      ]?.[name as keyof IndicateurFinancierApiType];
  }

  if (cpomStructures) {
    const { cpomStructureIndex, budgetIndex } =
      getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        year,
        type as StructureType
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
          <NumberDisplay
            value={value}
            type={isCurrency ? "currency" : "number"}
            className="text-sm"
          />
        </Badge>
      ) : (
        <NumberDisplay
          value={value}
          type={isCurrency ? "currency" : "number"}
        />
      )}
    </span>
  );
};

type Props = {
  type?: StructureType | IndicateurFinancierType;
  name: string;
  year: number;
  colored?: boolean;
  budgets?: BudgetApiType[];
  indicateursFinanciers?: IndicateurFinancierApiType[];
  cpomStructures?: CpomStructureApiWrite[];
  disabledYearsStart?: number;
  enabledYears?: number[];
  isCurrency?: boolean;
};
