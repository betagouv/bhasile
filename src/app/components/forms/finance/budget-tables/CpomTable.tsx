import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpoms/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getCpomLines } from "./getCpomLines";

export const CpomTable = ({ canEdit = true }: Props) => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes");

  const { cpom } = useCpomContext();

  const { years } = getYearRange({
    startYear: getYearFromDate(computeCpomDates(cpom).dateStart),
    endYear: getYearFromDate(computeCpomDates(cpom).dateEnd),
    order: "desc",
  });

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={getBudgetTableHeading({ years })}
      enableBorders
    >
      <BudgetTableLines
        years={years}
        lines={getCpomLines()}
        cpomMillesimes={cpomMillesimes}
        canEdit={canEdit}
      />
      <BudgetTableCommentLine
        years={years}
        label="Commentaire"
        cpomMillesimes={cpomMillesimes}
        canEdit={canEdit}
      />
    </Table>
  );
};

type Props = {
  canEdit?: boolean;
};
