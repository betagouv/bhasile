"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { useEffect, useId, useRef } from "react";

export default function BarChart({ data, options }: Props) {
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
          .${chartClass} .ct-series-a .ct-bar { stroke: var(--yellow-moutarde-850-200) !important; }
          .${chartClass} .ct-series-b .ct-bar { stroke: var(--yellow-moutarde-main-679) !important; }
          .${chartClass} .ct-series-c .ct-bar { stroke: var(--purple-glycine-850-200) !important; }
          .${chartClass} .ct-series-d .ct-bar { stroke: var(--blue-cumulus-850-200) !important; }
        `}
      </style>
    </div>
  );
}

type Props = {
  data: Chartist.BarChartData;
  options: Chartist.BarChartOptions;
};
