import * as Chartist from "chartist";
import { useEffect, useRef } from "react";

export const useBarLineChart = ({
  labels,
  barsSeries,
  lineSeries,
  colors,
  barOptions,
  lineOptions,
  pointStrokeWidth = 8,
}: UseBarLineChartArgs) => {
  const barChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let barChart: Chartist.BarChart | null = null;
    let lineChart: Chartist.LineChart | null = null;

    if (barChartRef.current && lineChartRef.current) {
      const barData = { labels, series: barsSeries };
      const lineData = { labels, series: [lineSeries] };

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

      barChart.on("draw", (ctx) => {
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

      lineChart.on("draw", (ctx) => {
        const dx =
          barX0 - (ctx as { chartRect: { x1: number } })?.chartRect?.x1;

        if (ctx.type === "line") {
          ctx.element.attr({
            style: `stroke: ${colors.line} !important; stroke-width: 2px;`,
            transform: `translate(${dx}, 0)`,
          });
        } else if (ctx.type === "point") {
          ctx.element.attr({
            style: `stroke: ${colors.line} !important; fill: ${colors.line}; stroke-width: ${pointStrokeWidth}px;`,
            transform: `translate(${dx}, 0)`,
          });
        }
      });
    }

    return () => {
      barChart?.detach();
      lineChart?.detach();
    };
  }, [
    labels,
    barsSeries,
    lineSeries,
    colors,
    barOptions,
    lineOptions,
    pointStrokeWidth,
  ]);

  return { barChartRef, lineChartRef };
};

type UseBarLineChartArgs = {
  labels: string[];
  barsSeries: (number | null)[][];
  lineSeries: (number | null)[];
  colors: {
    bars: string[];
    line: string;
  };
  barOptions: Chartist.BarChartOptions;
  lineOptions: Chartist.LineChartOptions;
  pointStrokeWidth?: number;
};
