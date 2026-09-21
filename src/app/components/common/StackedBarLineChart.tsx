"use client";

import "chartist/dist/index.css";

import { useId, useMemo, useState } from "react";

import { ChartAxisLabels } from "@/app/components/common/ChartAxisLabels";
import { useBarLineChart } from "@/app/hooks/useBarLineChart";

import { StackedBarChartTooltip } from "./StackedBarChartTooltip";

export const StackedBarLineChart = ({ data, colors, axisYLabel }: Props) => {
  const id = useId();
  const chartClass = `stacked-bar-line-${id.replace(/:/g, "-")}`;

  const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null);

  const syncOptions = useMemo(() => {
    const allValues = [...data.barsSeries.flat(), ...data.lineSeries];
    const maxValue = Math.max(...allValues, 0);
    const minValue = Math.min(...allValues, 0);

    const padding = (maxValue - minValue) * 0.1;
    return {
      high: maxValue + padding,
      low: minValue - padding,
      width: "100%",
    };
  }, [data.barsSeries, data.lineSeries]);

  const barOptions = useMemo(
    () => ({
      ...syncOptions,
      stackBars: false,
      fullWidth: false,
      axisX: { showGrid: false },
      axisY: { offset: 50 },
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
      axisY: { offset: 50, showGrid: false, showLabel: false },
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

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const containerBounds = event.currentTarget.getBoundingClientRect();
    const cursorX = event.clientX - containerBounds.left;
    const availableWidth = containerBounds.width - 50;
    const relativeX = cursorX - 50;

    if (relativeX < 0 || relativeX > availableWidth) {
      setActiveTooltip(null);
      return;
    }

    const totalItems = data.labels.length;
    if (totalItems === 0) {
      return;
    }

    const calculatedIndex = Math.min(
      Math.max(0, Math.floor((relativeX / availableWidth) * totalItems)),
      totalItems - 1
    );

    const yearLabel = data.labels[calculatedIndex];
    const value = data.lineSeries[calculatedIndex];

    setActiveTooltip({
      yearLabel,
      value,
      positionX: cursorX,
      positionY: event.clientY - containerBounds.top,
    });
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  return (
    <div className={`${chartClass} w-full`}>
      <ChartAxisLabels startLabel={axisYLabel} />
      <div
        style={{ position: "relative", height: 340 }}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
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
        {activeTooltip && (
          <div
            style={{
              position: "absolute",
              left: `${activeTooltip.positionX}px`,
              top: `${activeTooltip.positionY - 90}px`,
              transform: "translateX(-50%)",
              zIndex: 20,
            }}
          >
            <StackedBarChartTooltip
              yearLabel={activeTooltip.yearLabel}
              value={activeTooltip.value}
            />
          </div>
        )}
      </div>
    </div>
  );
};

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
  axisYLabel?: string;
};

type TooltipData = {
  yearLabel: string;
  value: number;
  positionX: number;
  positionY: number;
};
