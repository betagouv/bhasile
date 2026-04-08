import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpoms/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { StructureType } from "@/types/structure.type";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getBudgetTableLines } from "./getBudgetTableLines";

export const CpomTable = ({ type, showTitle }: Props) => {
  const { watch } = useFormContext();
  const budgets = watch("budgets") as BudgetApiType[];

  const { cpom } = useCpomContext();

  const { years } = getYearRange({ order: "desc" });

  const yearsInCpom = years.filter(
    (year) =>
      year >= getYearFromDate(computeCpomDates(cpom).dateStart) &&
      year <= getYearFromDate(computeCpomDates(cpom).dateEnd)
  );

  const isAutorisee = isStructureAutorisee(type);

  const detailAffectationEnabledYears = budgets
    .filter((budget) => budget.cpomStructureType === type)
    .filter((budget) => {
      const totalValue = Number(
        String(budget?.affectationReservesFondsDedies)
          .replaceAll(" ", "")
          .replace(",", ".") || 0
      );
      return totalValue !== 0 && !isNaN(totalValue);
    })
    .map((budget) => budget.year);

  return (
    <div>
      {showTitle && (
        <h2 className="text-title-blue-france text-lg mb-8 text-left font-bold">
          {type}
        </h2>
      )}
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years: yearsInCpom })}
        enableBorders
      >
        <BudgetTableLines
          years={yearsInCpom}
          type={type}
          lines={getBudgetTableLines(
            isAutorisee,
            detailAffectationEnabledYears
          )}
          budgets={budgets}
        />
        <BudgetTableCommentLine
          years={yearsInCpom}
          type={type}
          label="Commentaire"
          budgets={budgets}
        />
      </Table>
    </div>
  );
};

type Props = {
  type: StructureType;
  showTitle: boolean;
};
