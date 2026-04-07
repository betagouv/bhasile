import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpoms/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { CpomMillesimeFormValues } from "@/schemas/forms/base/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getBudgetTableLines } from "./getBudgetTableLines";

export const CpomTable = ({ type, showTitle }: Props) => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes") as CpomMillesimeFormValues[];

  const { cpom } = useCpomContext();

  const { years } = getYearRange({ order: "desc" });

  const yearsInCpom = years.filter(
    (year) =>
      year >= getYearFromDate(computeCpomDates(cpom).dateStart) &&
      year <= getYearFromDate(computeCpomDates(cpom).dateEnd)
  );

  const isAutorisee = isStructureAutorisee(type);

  const detailAffectationEnabledYears = cpomMillesimes
    .filter((cpomMillesime) => cpomMillesime.type === type)
    .filter((cpomMillesime) => {
      const totalValue = Number(
        String(cpomMillesime?.affectationReservesFondsDedies)
          .replaceAll(" ", "")
          .replace(",", ".") || 0
      );
      return totalValue !== 0 && !isNaN(totalValue);
    })
    .map((cpomMillesime) => cpomMillesime.year);

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
          cpomMillesimes={cpomMillesimes}
        />
        <BudgetTableCommentLine
          years={yearsInCpom}
          type={type}
          label="Commentaire"
          cpomMillesimes={cpomMillesimes}
        />
      </Table>
    </div>
  );
};

type Props = {
  type: StructureType;
  showTitle: boolean;
};
