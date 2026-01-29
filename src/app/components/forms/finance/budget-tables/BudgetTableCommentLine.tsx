import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";

import { BudgetTableCommentButtonAndModal } from "./BudgetTableCommentButtonAndModal";

export const BudgetTableCommentLine = ({
  label,
  budgets,
  cpomStructures,
  cpomMillesimes,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const { years } = getYearRange({ order: "desc" });

  if (!budgets && !cpomStructures && !cpomMillesimes) {
    return null;
  }
  return (
    <tr>
      <td>{label}</td>
      {years.map((year) => (
        <td key={year}>
          <BudgetTableCommentButtonAndModal
            year={year}
            disabledYearsStart={disabledYearsStart}
            enabledYears={enabledYears}
            cpomStructures={cpomStructures}
            cpomMillesimes={cpomMillesimes}
            budgets={budgets}
          />
        </td>
      ))}
    </tr>
  );
};

type Props = {
  label: string;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  cpomMillesimes?: CpomMillesimeApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
};
