import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
<<<<<<< HEAD
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
=======
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
>>>>>>> origin/migration

import { BudgetTableCommentButtonAndModal } from "./BudgetTableCommentButtonAndModal";

export const BudgetTableCommentLine = ({
  label,
  budgets,
  cpomStructures,
<<<<<<< HEAD
  cpomMillesimes,
=======
>>>>>>> origin/migration
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const { years } = getYearRange({ order: "desc" });

<<<<<<< HEAD
  if (!budgets && !cpomStructures && !cpomMillesimes) {
=======
  if (!budgets && !cpomStructures) {
>>>>>>> origin/migration
    return null;
  }
  return (
    <tr>
      <td>{label}</td>
      {years.map((year) => (
        <td key={year}>
          <BudgetTableCommentButtonAndModal
            year={year}
            disabledYearsStart={disabledYearsStart}
            enabledYears={enabledYears}
            cpomStructures={cpomStructures}
<<<<<<< HEAD
            cpomMillesimes={cpomMillesimes}
=======
>>>>>>> origin/migration
            budgets={budgets}
          />
        </td>
      ))}
    </tr>
  );
};

type Props = {
  label: string;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
<<<<<<< HEAD
  cpomMillesimes?: CpomMillesimeApiType[];
=======
>>>>>>> origin/migration
  disabledYearsStart?: number;
  enabledYears?: number[];
};
