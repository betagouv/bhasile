import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpom/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getCpomLines } from "./getCpomLines";

export const CpomTable = () => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes");

  const { cpom } = useCpomContext();

  const { years } = getYearRange({ order: "desc" });

  const yearsInCpom = years.filter(
    (year) =>
      year >= getYearFromDate(cpom.dateStart) &&
      year <= getYearFromDate(cpom.dateEnd)
  );

  console.log(cpomMillesimes);

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={getBudgetTableHeading({ years })}
      enableBorders
    >
      <BudgetTableLines
        lines={getCpomLines()}
        cpomMillesimes={cpomMillesimes}
        enabledYears={yearsInCpom}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        cpomMillesimes={cpomMillesimes}
        enabledYears={yearsInCpom}
      />
    </Table>
  );
};
