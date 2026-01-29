import { ReactNode } from "react";

import { BudgetApiType } from "@/schemas/api/budget.schema";
<<<<<<< HEAD
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
=======
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
>>>>>>> origin/migration

import { BudgetTableLine } from "./BudgetTableLine";
import { BudgetTableTitleLine } from "./BudgetTableTitleLine";

<<<<<<< HEAD
export const BudgetTableLines = ({
  lines,
  budgets,
  cpomStructures,
  cpomMillesimes,
}: Props) => {
=======
export const BudgetTableLines = ({ lines, budgets, cpomStructures }: Props) => {
>>>>>>> origin/migration
  return (
    <>
      {lines.map((block) => (
        <>
          <BudgetTableTitleLine key={block.title} label={block.title} />
          {block.lines.map((line) => (
            <BudgetTableLine
              key={line.name}
              name={line.name}
              label={line.label}
              subLabel={line.subLabel}
              disabledYearsStart={line.disabledYearsStart}
              enabledYears={line.enabledYears}
              budgets={budgets}
              cpomStructures={cpomStructures}
<<<<<<< HEAD
              cpomMillesimes={cpomMillesimes}
=======
>>>>>>> origin/migration
            />
          ))}
        </>
      ))}
    </>
  );
};

type Props = {
  lines: {
    title: string;
    lines: {
      name: string;
      label: string | ReactNode;
      subLabel?: string;
      disabledYearsStart?: number;
      enabledYears?: number[];
    }[];
  }[];
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
<<<<<<< HEAD
  cpomMillesimes?: CpomMillesimeApiType[];
=======
>>>>>>> origin/migration
};
