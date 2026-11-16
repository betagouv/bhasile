import { getBudgetCommentaire } from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiWrite } from "@/schemas/api/cpom.schema";
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
  const commentaires = canEdit
    ? []
    : years.map((year) =>
        getBudgetCommentaire({ type, year, budgets, cpomStructures })
      );
  if (!canEdit && commentaires.every((commentaire) => !commentaire)) {
    return null;
  }
  return (
    <tr className="print:hidden">
      <td className="text-left!">
        <strong className="whitespace-nowrap">{label}</strong>
      </td>
      {years.map((year, index) => (
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
              commentaire={commentaires[index]}
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
  cpomStructures?: CpomStructureApiWrite[];
  years: number[];
  disabledYearsStart?: number;
  enabledYears?: number[];
  canEdit?: boolean;
};
