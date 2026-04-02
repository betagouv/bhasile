import { Fragment, ReactNode } from "react";

import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { BudgetTableLine } from "./BudgetTableLine";
import { BudgetTableTitleLine } from "./BudgetTableTitleLine";

export const BudgetTableLines = ({
  type,
  lines,
  budgets,
  cpomStructures,
  cpomMillesimes,
  years,
  enabledYears,
  canEdit = true,
}: Props) => {
  return (
    <>
      {lines.map((block) => (
        <Fragment key={block.title}>
          <BudgetTableTitleLine label={block.title} />
          {block.lines.map((line) => (
            <BudgetTableLine
              key={"line-" + line.name}
              name={line.name}
              label={line.label}
              subLabel={line.subLabel}
              years={years}
              disabledYearsStart={line.disabledYearsStart}
              enabledYears={enabledYears ?? line.enabledYears}
              colored={line.colored}
              budgets={budgets}
              cpomStructures={cpomStructures}
              cpomMillesimes={cpomMillesimes}
              type={type}
              canEdit={canEdit}
            />
          ))}
        </Fragment>
      ))}
    </>
  );
};

type Props = {
  type?: StructureType;
  lines: {
    title: string;
    lines: {
      name: string;
      label: string | ReactNode;
      subLabel?: string;
      colored?: boolean;
      disabledYearsStart?: number;
      enabledYears?: number[];
    }[];
  }[];
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  cpomMillesimes?: CpomMillesimeApiType[];
  years: number[];
  enabledYears?: number[];
  canEdit?: boolean;
};
