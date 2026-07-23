"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { useId, useMemo } from "react";

import { useBarLineChart } from "@/app/hooks/useBarLineChart";

type ChartData = {
  labels: string[];
  barsSeries: (number | null)[][];
  lineSeries: (number | null)[];
};

type ChartColors = {
  bars: string[];
  line: string;
};

type Props = {
  data: ChartData;
  colors: ChartColors;
  leftAxisLabel?: string;
  rightAxisLabel?: string;
};

export const DoubleYAxisBarLineChart = ({
  data,
  colors,
  leftAxisLabel = "note",
  rightAxisLabel = "structures",
}: Props) => {
  const id = useId();
  const chartClass = `double-y-axis-bar-line-${id.replace(/:/g, "-")}`;

  const barOptions = useMemo<Chartist.BarChartOptions>(() => {
    const yAxisOffset = 50;
    return {
      stackBars: false,
      axisX: { showGrid: false },
      axisY: {
        position: "start",
        offset: yAxisOffset,
        showGrid: true,
      },
      chartPadding: { left: 0, right: yAxisOffset, top: 40, bottom: 20 },
      seriesBarDistance: 0,
    };
  }, []);

  const lineOptions = useMemo<Chartist.LineChartOptions>(() => {
    const yAxisOffset = 50;
    return {
      fullWidth: false,
      lineSmooth: false,
      showGridBackground: false,
      axisX: { showGrid: false, showLabel: false },
      axisY: {
        position: "end",
        offset: yAxisOffset,
        showGrid: false,
      },
      chartPadding: { left: yAxisOffset, right: 0, top: 40, bottom: 20 },
    };
  }, []);

  const { barChartRef, lineChartRef } = useBarLineChart({
    labels: data.labels,
    barsSeries: data.barsSeries,
    lineSeries: data.lineSeries,
    colors,
    barOptions,
    lineOptions,
    pointStrokeWidth: 8,
  });

  return (
    <div
      className={chartClass}
      style={{ position: "relative", height: 340, width: "100%" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 10,
          fontSize: "14px",
          color: "#666",
          zIndex: 20,
        }}
      >
        {leftAxisLabel}
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 10,
          fontSize: "14px",
          color: "#666",
          zIndex: 20,
        }}
      >
        {rightAxisLabel}
      </div>

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
