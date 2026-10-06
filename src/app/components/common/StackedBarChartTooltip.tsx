"use client";

import Badge from "@codegouvfr/react-dsfr/Badge";

import { NumberDisplay } from "./NumberDisplay";

export const StackedBarChartTooltip = ({ yearLabel, value }: Props) => {
  const isPositive = value >= 0;
  const absoluteValue = Math.abs(value);

  return (
    <div className="inline-flex flex-col gap-1 rounded bg-default-grey-hover p-4 pointer-events-none">
      <span className="text-base font-normal text-mention-grey">
        {yearLabel}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-title-grey">
          {isPositive ? "+" : "-"}&nbsp;
          <NumberDisplay
            value={absoluteValue}
            type="currency"
            maximumFractionDigits={0}
          />
        </span>
        <Badge noIcon severity={isPositive ? "success" : "error"}>
          {isPositive ? "Excédent" : "Déficit"}
        </Badge>
      </div>
    </div>
  );
};

type Props = {
  yearLabel: string;
  value: number;
};
