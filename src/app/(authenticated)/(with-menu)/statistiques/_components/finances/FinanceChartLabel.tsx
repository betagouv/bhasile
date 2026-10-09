import { ReactElement } from "react";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

export const FinanceChartLabel = ({
  chartData,
  index,
  label,
}: Props): ReactElement => {
  const isIncomplete = chartData.incompleteYears?.[index] ?? false;
  const isCurrentYear =
    Number(chartData.labels[index]) === new Date().getFullYear();

  return (
    <span className="flex items-center gap-1 text-xs text-disabled-grey">
      {label}
      {!isCurrentYear && <span> * </span>}
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
