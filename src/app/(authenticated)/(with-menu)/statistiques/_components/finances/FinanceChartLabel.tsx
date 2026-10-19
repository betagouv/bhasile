import { ReactElement } from "react";

import { shouldShowYearAsterisk } from "@/app/utils/statistiques-period.util";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

export const FinanceChartLabel = ({
  chartData,
  index,
  label,
  nbStructures,
  structuresPercentage,
}: Props): ReactElement => {
  const isIncomplete = chartData.incompleteYears?.[index] ?? false;

  return (
    <span className="flex items-center gap-1 text-xs text-disabled-grey">
      {label}
      {shouldShowYearAsterisk(chartData.labels[index]) && <span> * </span>}
      {isIncomplete && (
        <IncompleteDataIndicator
          nbStructures={nbStructures ?? 0}
          structuresPercentage={structuresPercentage || ""}
        />
      )}
    </span>
  );
};

type Props = {
  chartData: {
    labels: string[];
    incompleteYears: boolean[];
  };
  index: number;
  label: string;
  nbStructures?: number;
  structuresPercentage?: string;
};
