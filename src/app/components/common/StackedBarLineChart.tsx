"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { useEffect, useId, useRef } from "react";

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
  const barChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const chartClass = `stacked-bar-line-${id.replace(/:/g, "-")}`;

  useEffect(() => {
    let barChart: Chartist.BarChart | null = null;
    let lineChart: Chartist.LineChart | null = null;

    if (barChartRef.current && lineChartRef.current) {
      const allValues = [...data.barsSeries.flat(), ...data.lineSeries];
      const maxValue = Math.max(...allValues, 0);
      const minValue = Math.min(...allValues, 0);

      const padding = (maxValue - minValue) * 0.1;
      const syncOptions = {
        high: maxValue + padding,
        low: minValue - padding,
      };

      const barData = {
        labels: data.labels,
        series: data.barsSeries,
      };

      const lineData = {
        labels: data.labels,
        series: [data.lineSeries],
      };

      const barOptions = {
        ...syncOptions,
        stackBars: false,
        fullWidth: false,
        axisX: { showGrid: false },
        axisY: { offset: 70 },
        seriesBarDistance: 0,
      };

      const lineOptions = {
        ...syncOptions,
        fullWidth: false,
        lineSmooth: false,
        showGridBackground: false,
        axisX: { showGrid: false, showLabel: false },
        axisY: { offset: 70, showGrid: false, showLabel: false },
      };

      barChart = new Chartist.BarChart(
        barChartRef.current,
        barData,
        barOptions
      );
      lineChart = new Chartist.LineChart(
        lineChartRef.current,
        lineData,
        lineOptions
      );

      let barX0 = 0;

      barChart.on("draw", function (ctx) {
        if (ctx.type === "bar") {
          if (ctx.index === 0) {
            barX0 = ctx.x1;
          }

          const barColor = colors.bars[ctx.seriesIndex] || "#000000";

          ctx.element.attr({
            style: `stroke: ${barColor} !important; stroke-width: 25px;`,
          });
        }
      });

      lineChart.on("draw", function (ctx) {
        const dx = barX0 - (ctx as { chartRect: { x1: number } }).chartRect.x1;

        if (ctx.type === "line") {
          ctx.element.attr({
            style: `stroke: ${colors.line} !important; stroke-width: 2px;`,
            transform: `translate(${dx}, 0)`,
          });
        } else if (ctx.type === "point") {
          ctx.element.attr({
            style: `stroke: ${colors.line} !important; fill: ${colors.line}; stroke-width: 6px;`,
            transform: `translate(${dx}, 0)`,
          });
        }
      });
    }

    return () => {
      if (barChart) {
        barChart.detach();
      }
      if (lineChart) {
        lineChart.detach();
      }
    };
  }, [data, colors]);

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
