"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { PropsWithChildren, useEffect, useId, useMemo, useRef } from "react";

export default function PieChart({
  data,
  options,
  size = 60,
  children,
  colors = [
    "var(--yellow-moutarde-850-200)",
    "var(--yellow-moutarde-main-679)",
    "var(--grey-925-125)",
  ],
  isDonut = false,
}: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const uniqueIdentifier = useId();
  const chartClass = `piechart-${uniqueIdentifier.replace(/:/g, "-")}`;

  const processedData = useMemo(() => {
    if (!data.series || data.series.length === 0) {
      return data;
    }

    const firstSeriesValue = extractSeriesValue(data.series[0]);

    if (firstSeriesValue !== 0) {
      return data;
    }

    const remainingSeriesSum = data.series
      .slice(1)
      .reduce<number>((accumulator, seriesItem) => {
        return accumulator + extractSeriesValue(seriesItem);
      }, 0);

    if (remainingSeriesSum <= 0) {
      return data;
    }

    const minimumPieElementValue = remainingSeriesSum * MINIMUM_PIE_SERIE_SIZE;

    const updatedSeries = data.series.map((seriesItem, index) => {
      if (index === 0) {
        if (typeof seriesItem === "number") {
          return minimumPieElementValue;
        }
        if (typeof seriesItem === "object" && seriesItem !== null) {
          return { ...seriesItem, value: minimumPieElementValue };
        }
      }
      return seriesItem;
    });

    return {
      ...data,
      series: updatedSeries,
    };
  }, [data]);

  useEffect(() => {
    let chart: Chartist.PieChart | null = null;

    if (chartRef.current) {
      const chartOptions: Chartist.PieChartOptions = {
        width: `${size}px`,
        height: `${size}px`,
        donut: isDonut,
        donutWidth: isDonut ? Math.round(size / 4) : undefined,
        ...options,
      };

      chart = new Chartist.PieChart(
        chartRef.current,
        processedData,
        chartOptions
      );
    }

    return () => {
      if (chart) {
        chart.detach();
      }
    };
  }, [processedData, options, isDonut, size]);

  const getPieColors = () => {
    let css = `.${chartClass} .ct-series-a .ct-slice-pie { fill: ${colors[0]} !important; }`;
    if (data.series.length === 2) {
      css += `.${chartClass} .ct-series-b .ct-slice-pie { fill: ${colors[2]} !important; }`;
    } else if (data.series.length === 3) {
      css += `.${chartClass} .ct-series-b .ct-slice-pie { fill: ${colors[1]} !important; }
              .${chartClass} .ct-series-c .ct-slice-pie { fill: ${colors[2]} !important; }`;
    } else if (data.series.length === 4) {
      css += `.${chartClass} .ct-series-b .ct-slice-pie { fill: ${colors[1]} !important; }
              .${chartClass} .ct-series-c .ct-slice-pie { fill: ${colors[2]} !important; }
              .${chartClass} .ct-series-d .ct-slice-pie { fill: ${colors[3]} !important; }`;
    } else if (data.series.length === 5) {
      css += `.${chartClass} .ct-series-b .ct-slice-pie { fill: ${colors[1]} !important; }
              .${chartClass} .ct-series-c .ct-slice-pie { fill: ${colors[2]} !important; }
              .${chartClass} .ct-series-d .ct-slice-pie { fill: ${colors[3]} !important; }
              .${chartClass} .ct-series-e .ct-slice-pie { fill: ${colors[4]} !important; }`;
    }
    return css;
  };

  const getDonutColors = () => {
    let css = `.${chartClass} .ct-series-a .ct-slice-donut { stroke: ${colors[0]} !important; }`;
    if (data.series.length === 2) {
      css += `.${chartClass} .ct-series-b .ct-slice-donut { stroke: ${colors[2]} !important; }`;
    } else if (data.series.length === 3) {
      css += `.${chartClass} .ct-series-b .ct-slice-donut { stroke: ${colors[1]} !important; }
              .${chartClass} .ct-series-c .ct-slice-donut { stroke: ${colors[2]} !important; }`;
    }
    return css;
  };

  return (
    <div
      className={`${chartClass} relative block mx-auto`}
      style={{
        width: size,
        height: size,
      }}
    >
      <div ref={chartRef} style={{ width: size, height: size }} />
      {children}
      <style>{isDonut ? getDonutColors() : getPieColors()}</style>
    </div>
  );
}

const extractSeriesValue = (
  seriesItem: number | Chartist.PieChartData["series"][number] | undefined
): number => {
  if (typeof seriesItem === "number") {
    return seriesItem;
  }
  if (
    typeof seriesItem === "object" &&
    seriesItem !== null &&
    "value" in seriesItem &&
    typeof seriesItem.value === "number"
  ) {
    return seriesItem.value;
  }
  return 0;
};

const MINIMUM_PIE_SERIE_SIZE = 0.008;

type Props = PropsWithChildren<{
  data: Chartist.PieChartData;
  options?: Chartist.PieChartOptions;
  size?: number;
  colors?: string[];
  isDonut?: boolean;
}>;
