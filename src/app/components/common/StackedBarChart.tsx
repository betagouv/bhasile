"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { useEffect, useId, useRef } from "react";

import { ChartAxisLabels } from "@/app/components/common/ChartAxisLabels";
import { withCompactAxisY } from "@/app/utils/chart.util";

export const StackedBarChart = ({ data, colors, axisYLabel }: Props) => {
  const barChartRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const chartClass = `stacked-bar-${id.replace(/:/g, "-")}`;

  useEffect(() => {
    let barChart: Chartist.BarChart | null = null;

    if (barChartRef.current) {
      const barData = {
        labels: data.labels,
        series: data.series,
      };

      const barOptions: Chartist.BarChartOptions = {
        stackBars: true,
        axisX: {
          showGrid: false,
        },
        axisY: {
          offset: 40,
        },
      };

      barChart = new Chartist.BarChart(
        barChartRef.current,
        barData,
        withCompactAxisY(barOptions)
      );

      barChart.on("draw", function (ctx) {
        if (ctx.type === "bar") {
          const seriesColor = colors[ctx.seriesIndex];

          ctx.element.attr({
            style: `stroke: ${seriesColor} !important; stroke-width: 30px;`,
          });
        }
      });
    }

    return () => {
      if (barChart) {
        barChart.detach();
      }
    };
  }, [data, colors]);

  return (
    <div className={chartClass}>
      <ChartAxisLabels startLabel={axisYLabel} />
      <div
        ref={barChartRef}
        style={{
          width: "100%",
          height: 340,
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
