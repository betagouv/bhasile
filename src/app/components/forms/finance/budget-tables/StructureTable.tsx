import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import { parseFrenchNumber } from "@/app/utils/number.util";
import { getRealCreationYear } from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getBudgetTableLines } from "./getBudgetTableLines";

export const StructureTable = ({ canEdit = true }: Props) => {
  const parentFormContext = useFormContext();

  const { structure } = useStructureContext();

  const { years } = getYearRange({ order: "desc" });
  const startYear = getRealCreationYear(structure);
  const yearsToDisplay = years.filter((year) => year >= startYear);

  const localForm = useForm();
  const { watch, formState } = parentFormContext || localForm;

  const errors = formState.errors;
  const hasErrors =
    Array.isArray(errors.budgets) &&
    errors.budgets.some(
      (budgetItemErrors: Record<string, unknown>) =>
        budgetItemErrors?.dotationDemandee ||
        budgetItemErrors?.dotationAccordee ||
        budgetItemErrors?.totalProduits ||
        budgetItemErrors?.totalProduitsProposes ||
        budgetItemErrors?.totalCharges ||
        budgetItemErrors?.totalChargesProposees ||
        budgetItemErrors?.repriseEtat ||
        budgetItemErrors?.affectationReservesFondsDedies ||
        budgetItemErrors?.commentaire
    );

  const budgets = canEdit
    ? (watch("budgets") as BudgetApiType[])
    : structure.budgets;

  if (!budgets || budgets.length === 0) {
    return null;
  }

  const detailAffectationEnabledYears = budgets
    .filter((budget) => {
      const totalValue = parseFrenchNumber(
        budget?.affectationReservesFondsDedies
      );
      return totalValue !== 0 && totalValue !== null;
    })
    .map((budget) => budget.year);

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      hasErrors={hasErrors}
      headings={getBudgetTableHeading({ years: yearsToDisplay, structure })}
      enableBorders
      stickFirstColumn
    >
      <BudgetTableLines
        lines={getBudgetTableLines(
          structure.isAutorisee,
          detailAffectationEnabledYears
        )}
        budgets={budgets}
        canEdit={canEdit}
        years={yearsToDisplay}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        budgets={budgets}
        enabledYears={yearsToDisplay}
        canEdit={canEdit}
        years={yearsToDisplay}
      />
    </Table>
  );
};

type Props = {
  canEdit?: boolean;
};
