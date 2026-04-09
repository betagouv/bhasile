import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { BudgetTableCommentButtonAndModal } from "./BudgetTableCommentButtonAndModal";
import { BudgetTableCommentStaticButtonAndModal } from "./BudgetTableCommentStaticButtonAndModal";

export const BudgetTableCommentLine = ({
  type,
  label,
  budgets,
  cpomStructures,
  years,
  disabledYearsStart,
  enabledYears,
  canEdit = true,
}: Props) => {
  if (!budgets && !cpomStructures) {
    return null;
  }
  return (
    <tr>
      <td className="text-left!">
        <strong className="whitespace-nowrap">{label}</strong>
      </td>
      {years.map((year) => (
        <td key={year}>
          {canEdit ? (
            <BudgetTableCommentButtonAndModal
              year={year}
              disabledYearsStart={disabledYearsStart}
              enabledYears={enabledYears}
              cpomStructures={cpomStructures}
              budgets={budgets}
              type={type}
            />
          ) : (
            <BudgetTableCommentStaticButtonAndModal
              year={year}
              cpomStructures={cpomStructures}
              budgets={budgets}
              type={type}
            />
          )}
        </td>
      ))}
    </tr>
  );
};

type Props = {
  type?: StructureType;
  label: string;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  years: number[];
  disabledYearsStart?: number;
  enabledYears?: number[];
  canEdit?: boolean;
};
