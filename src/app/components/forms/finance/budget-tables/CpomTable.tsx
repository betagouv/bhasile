import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpoms/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";
import { CpomMillesimeApiType } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getCpomLines } from "./getCpomLines";

export const CpomTable = ({ type, showTitle }: Props) => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes") as CpomMillesimeApiType[];

  const { cpom } = useCpomContext();

  const { years } = getYearRange({ order: "desc" });

  const yearsInCpom = years.filter(
    (year) =>
      year >= getYearFromDate(computeCpomDates(cpom).dateStart) &&
      year <= getYearFromDate(computeCpomDates(cpom).dateEnd)
  );

  const cpomMillesimesOfType = cpomMillesimes?.filter(
    (cpomMillesime) => cpomMillesime.type === type
  );

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={getBudgetTableHeading({ years: yearsInCpom })}
      enableBorders
    >
      {showTitle && (
        <caption className="text-title-blue-france text-lg mb-3 text-left font-bold">
          {type}
        </caption>
      )}
      <BudgetTableLines
        years={yearsInCpom}
        lines={getCpomLines()}
        cpomMillesimes={cpomMillesimesOfType}
      />
      <BudgetTableCommentLine
        years={yearsInCpom}
        label="Commentaire"
        cpomMillesimes={cpomMillesimesOfType}
      />
    </Table>
  );
};

type Props = {
  type: StructureType;
  showTitle: boolean;
};
