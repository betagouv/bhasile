import { ReactElement } from "react";

import { shouldShowYearAsterisk } from "@/app/utils/statistiques-period.util";
import { useExportContext } from "@/contexts/ExportContext";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

export const FinanceChartLabel = ({
  chartData,
  index,
  label,
}: Props): ReactElement => {
  const isIncomplete = chartData.incompleteYears?.[index] ?? false;
  const isExporting = useExportContext();

  const yearlyNbStructures = chartData.nbRenseignees?.[index] || 0;
  const yearlyPercentage = chartData.percentages?.[index] || "";

  return (
    <div className="flex print:block print:text-center items-center gap-1 text-xs text-disabled-grey">
      {label}
      {shouldShowYearAsterisk(chartData.labels[index]) && <span> * </span>}
      {isIncomplete &&
        (isExporting ? (
          <div className="text-[10px]">
            {yearlyNbStructures} structures actualisées
          </div>
        ) : (
          <IncompleteDataIndicator
            nbStructures={yearlyNbStructures}
            structuresPercentage={yearlyPercentage}
          />
        ))}
    </div>
  );
};

type Props = {
  chartData: {
    labels: string[];
    incompleteYears: boolean[];
    nbRenseignees?: number[];
    percentages?: string[];
  };
  index: number;
  label: string;
};
