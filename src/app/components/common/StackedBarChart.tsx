"use client";

import "chartist/styles.css";

import * as Chartist from "chartist";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { ChartAxisLabels } from "@/app/components/common/ChartAxisLabels";
import { withCompactAxisY } from "@/app/utils/chart.util";

const AXIS_Y_OFFSET = 40;

export const StackedBarChart = ({ data, colors, axisYLabel }: Props) => {
  const barChartRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const chartClass = `stacked-bar-${id.replace(/:/g, "-")}`;
  const [containerWidth, setContainerWidth] = useState<number>(550);

  useEffect(() => {
    const updateWidth = () => {
      if (barChartRef.current?.parentElement) {
        setContainerWidth(barChartRef.current.parentElement.offsetWidth);
      }
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);

    const handleBeforePrint = () => {
      if (barChartRef.current?.parentElement) {
        setContainerWidth(barChartRef.current.parentElement.offsetWidth * 0.95);
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);

    return () => {
      window.removeEventListener("resize", updateWidth);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, []);

  const chartStyle = useMemo(
    () =>
      ({
        "--ct-bar-width": "30px",
        ...Object.fromEntries(
          colors.map((color, index) => [
            `--ct-series-${String.fromCharCode(97 + index)}`,
            color,
          ])
        ),
      }) as React.CSSProperties,
    [colors]
  );

  useEffect(() => {
    let barChart: Chartist.BarChart | null = null;

    if (barChartRef.current && containerWidth > 0) {
      const barOptions: Chartist.BarChartOptions = {
        height: "340px",
        width: containerWidth,
        stackBars: true,
        axisX: { showGrid: false },
        axisY: { offset: AXIS_Y_OFFSET },
      };

      barChart = new Chartist.BarChart(
        barChartRef.current,
        { labels: data.labels, series: data.series },
        withCompactAxisY(barOptions)
      );
    }

    return () => {
      barChart?.detach();
    };
  }, [data, containerWidth]);

  return (
    <div className={`${chartClass} w-full`}>
      <ChartAxisLabels startLabel={axisYLabel} />
      <div
        ref={barChartRef}
        style={{
          width: "100%",
          height: 340,
          ...chartStyle,
        }}
      />
    </div>
  );
};

type Props = {
  data: {
    labels: string[];
    series: number[][];
  };
  colors: string[];
  axisYLabel?: string;
};
