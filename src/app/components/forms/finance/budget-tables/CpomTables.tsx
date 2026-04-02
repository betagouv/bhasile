import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpoms/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getCpomLines } from "./getCpomLines";

export const CpomTables = () => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes");

  const
  const { cpom } = useCpomContext();

  const { years } = getYearRange({ order: "desc" });

  const yearsInCpom = years.filter(
    (year) =>
      year >= getYearFromDate(computeCpomDates(cpom).dateStart) &&
      year <= getYearFromDate(computeCpomDates(cpom).dateEnd)
  );

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={getBudgetTableHeading({ years: yearsInCpom })}
      enableBorders
    >
      <BudgetTableLines
        years={yearsInCpom}
        lines={getCpomLines()}
        cpomMillesimes={cpomMillesimes}
      />
      <BudgetTableCommentLine
        years={yearsInCpom}
        label="Commentaire"
        cpomMillesimes={cpomMillesimes}
      />
    </Table>
  );
};
