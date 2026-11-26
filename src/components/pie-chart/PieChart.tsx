"use client";

import "chartist/dist/index.css";

import type { PieChartData, PieChartPresetOptions } from "chartist";
import { PropsWithChildren, ReactNode, useId, useMemo, useRef } from "react";

import { useChartistPieChart } from "@/hooks/useChartistPieChart";
import {
  buildSliceColorsCss,
  extractSeriesValue,
  PIE_CHART_PADDING,
} from "@/utils/pie-chart.util";

import { PieChartCallouts } from "./PieChartCallouts";

export const PieChart = ({
  data,
  options,
  size = 60,
  children,
  colors = DEFAULT_COLORS,
  isDonut = false,
  calloutLabels,
  calloutWidth = 160,
}: Props) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartClass = `piechart-${useId().replace(/:/g, "-")}`;

  const chartOptions = useMemo<PieChartPresetOptions>(
    () => ({
      width: `${size}px`,
      height: `${size}px`,
      chartPadding: PIE_CHART_PADDING,
      donut: isDonut,
      donutWidth: isDonut ? Math.round(size / 4) : undefined,
      ...options,
    }),
    [options, isDonut, size]
  );

  useChartistPieChart(chartRef, data, chartOptions);

  const chart = (
    <div className="relative" style={{ width: size, height: size }}>
      <div ref={chartRef} style={{ width: size, height: size }} />
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className={`${chartClass} mx-auto w-fit`}>
      {calloutLabels ? (
        <PieChartCallouts
          values={data.series.map(extractSeriesValue)}
          labels={calloutLabels}
          size={size}
          donutWidth={getNumericDonutWidth(chartOptions)}
          calloutWidth={calloutWidth}
        >
          {chart}
        </PieChartCallouts>
      ) : (
        chart
      )}
      <style>
        {buildSliceColorsCss({
          chartClass,
          isDonut: Boolean(chartOptions.donut),
          colors,
          seriesCount: data.series.length,
        })}
      </style>
    </div>
  );
};

const DEFAULT_COLORS = [
  "var(--yellow-moutarde-850-200)",
  "var(--yellow-moutarde-main-679)",
  "var(--grey-925-125)",
];

const getNumericDonutWidth = ({
  donut,
  donutWidth,
}: PieChartPresetOptions): number | undefined =>
  donut && typeof donutWidth === "number" ? donutWidth : undefined;

type Props = PropsWithChildren<{
  data: PieChartData;
  options?: PieChartPresetOptions;
  size?: number;
  colors?: string[];
  isDonut?: boolean;
  calloutLabels?: ReactNode[];
  calloutWidth?: number;
}>;
