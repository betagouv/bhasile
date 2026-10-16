import { ReactElement } from "react";

import { shouldShowYearAsterisk } from "@/app/utils/statistiques-period.util";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

export const FinanceChartLabel = ({
  chartData,
  index,
  label,
}: Props): ReactElement => {
  const isIncomplete = chartData.incompleteYears?.[index] ?? false;

  return (
    <span className="flex items-center gap-1 text-xs text-disabled-grey">
      {label}
      {shouldShowYearAsterisk(chartData.labels[index]) && <span> * </span>}
      {isIncomplete && (
        // TODO : mettre de vrais valeurs ici
        <IncompleteDataIndicator nbStructures={42} structuresPercentage={42} />
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
};
