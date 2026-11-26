import { pieChart, PieChartData, PieChartPresetOptions } from "chartist";
import { RefObject, useEffect } from "react";

export const useChartistPieChart = (
  containerRef: RefObject<HTMLDivElement | null>,
  data: PieChartData,
  options: PieChartPresetOptions
) => {
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = pieChart(containerRef.current, data, options);

    return () => {
      chart.destroy();
    };
  }, [containerRef, data, options]);
};
