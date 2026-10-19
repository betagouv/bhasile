import { ReactElement } from "react";

import { shouldShowYearAsterisk } from "@/app/utils/statistiques-period.util";
import { useExportContext } from "@/contexts/ExportContext";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

export const FinanceChartLabel = ({
  chartData,
  index,
  label,
  nbStructures,
  structuresPercentage,
}: Props): ReactElement => {
  const isIncomplete = chartData.incompleteYears?.[index] ?? false;
  const isExporting = useExportContext();

  return (
    <span className="flex print:block print:text-center items-center gap-1 text-xs text-disabled-grey">
      {label}
      {shouldShowYearAsterisk(chartData.labels[index]) && <span> * </span>}
      {isIncomplete &&
        (isExporting ? (
          <div className="text-[10px]">
            {nbStructures} structures actualisées
          </div>
        ) : (
          <IncompleteDataIndicator
            nbStructures={nbStructures ?? 0}
            structuresPercentage={structuresPercentage || ""}
          />
        ))}
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
