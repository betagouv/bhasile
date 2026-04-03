import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpoms/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";
import { StructureType } from "@/types/structure.type";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getCpomLines } from "./getCpomLines";

export const CpomTable = ({ type, showTitle }: Props) => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes");

  const { cpom } = useCpomContext();

  const { years } = getYearRange({ order: "desc" });

  const yearsInCpom = years.filter(
    (year) =>
      year >= getYearFromDate(computeCpomDates(cpom).dateStart) &&
      year <= getYearFromDate(computeCpomDates(cpom).dateEnd)
  );

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
          lines={getCpomLines()}
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
