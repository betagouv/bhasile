"use client";

import "chartist/dist/index.css";

import { useId, useMemo } from "react";

import { useBarLineChart } from "@/app/hooks/useBarLineChart";

type ChartData = {
  labels: string[];
  barsSeries: number[][];
  lineSeries: number[];
};

type ChartColors = {
  bars: string[];
  line: string;
};

type Props = {
  data: ChartData;
  colors: ChartColors;
};

export const StackedBarLineChart = ({ data, colors }: Props) => {
  const id = useId();
  const chartClass = `stacked-bar-line-${id.replace(/:/g, "-")}`;

  const syncOptions = useMemo(() => {
    const allValues = [...data.barsSeries.flat(), ...data.lineSeries];
    const maxValue = Math.max(...allValues, 0);
    const minValue = Math.min(...allValues, 0);

    const padding = (maxValue - minValue) * 0.1;
    return {
      high: maxValue + padding,
      low: minValue - padding,
    };
  }, [data.barsSeries, data.lineSeries]);

  const barOptions = useMemo(
    () => ({
      ...syncOptions,
      stackBars: false,
      fullWidth: false,
      axisX: { showGrid: false },
      axisY: { offset: 70 },
      seriesBarDistance: 0,
    }),
    [syncOptions]
  );

  const lineOptions = useMemo(
    () => ({
      ...syncOptions,
      fullWidth: false,
      lineSmooth: false,
      showGridBackground: false,
      axisX: { showGrid: false, showLabel: false },
      axisY: { offset: 70, showGrid: false, showLabel: false },
    }),
    [syncOptions]
  );

  const { barChartRef, lineChartRef } = useBarLineChart({
    labels: data.labels,
    barsSeries: data.barsSeries,
    lineSeries: data.lineSeries,
    colors,
    barOptions,
    lineOptions,
    pointStrokeWidth: 6,
  });

  return (
    <div className={chartClass} style={{ position: "relative", height: 340 }}>
      <div
        ref={barChartRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <div
        ref={lineChartRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
