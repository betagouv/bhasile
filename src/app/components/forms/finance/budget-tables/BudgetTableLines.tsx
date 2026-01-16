import { ReactNode } from "react";

import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";

import { BudgetTableLine } from "./BudgetTableLine";
import { BudgetTableTitleLine } from "./BudgetTableTitleLine";

export const BudgetTableLines = ({ lines, budgets, cpomStructures }: Props) => {
  console.log(lines);
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
};
