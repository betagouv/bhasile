"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { useEffect, useId, useRef } from "react";

export default function BarChart({ data, options, colors }: Props) {
  if (!colors) {
    colors = [
      "var(--yellow-moutarde-850-200)",
      "var(--yellow-moutarde-main-679)",
      "var(--purple-glycine-850-200)",
      "var(--blue-cumulus-850-200)",
    ];
  }
  const chartRef = useRef(null);
  const id = useId();
  const chartClass = `barchart-${id.replace(/:/g, "-")}`;

  useEffect(() => {
    let chart = null;
    if (chartRef.current) {
      chart = new Chartist.BarChart(chartRef.current, data, options);
      const extraSpace = 10;

      chart.on("draw", function (ctx) {
        if (ctx.type === "bar" && ctx.seriesIndex >= 2) {
          ctx.element.attr({
            x1: ctx.x1 + extraSpace,
            x2: ctx.x2 + extraSpace,
          });
        }
      });
    }
    return () => {
      if (chart) {
        chart.detach();
      }
    };
  }, [data, options]);

  return (
    <div className={chartClass}>
      <div ref={chartRef} style={{ height: 340 }} />
      <style>
        {`
          .${chartClass} .ct-series-a .ct-bar { stroke: ${colors[0]} !important; }
          .${chartClass} .ct-series-b .ct-bar { stroke: ${colors[1]} !important; }
          .${chartClass} .ct-series-c .ct-bar { stroke: ${colors[2]} !important; }
          .${chartClass} .ct-series-d .ct-bar { stroke: ${colors[3]} !important; }
        `}
      </style>
    </div>
  );
}

type Props = {
  data: Chartist.BarChartData;
  options: Chartist.BarChartOptions;
  colors?: string[];
};
