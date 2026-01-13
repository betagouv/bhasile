import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";

import { BudgetTableCommentButtonAndModal } from "./BudgetTableCommentButtonAndModal";

export const BudgetTableCommentLine = ({
  label,
  budgets,
  cpomStructures,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const { years } = getYearRange({ order: "desc" });

  if (!budgets && !cpomStructures) {
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
            budgets={budgets}
          />
        </td>
      ))}
    </tr>
  );
};

interface Props {
  label: string;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
}
