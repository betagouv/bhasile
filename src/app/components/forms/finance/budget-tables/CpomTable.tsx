import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpoms/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";
import { parseFrenchNumber } from "@/app/utils/number.util";
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
      year >= getYearFromDate(cpom.dateStart) &&
      year <= getYearFromDate(cpom.dateEnd)
  );

  const isAutorisee = isStructureAutorisee(type);

  const detailAffectationEnabledYears = budgets
    .filter((budget) => budget.cpomStructureType === type)
    .filter((budget) => {
      const totalValue = parseFrenchNumber(
        budget?.affectationReservesFondsDedies
      );
      return totalValue !== 0 && totalValue !== null;
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
        stickFirstColumn
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
