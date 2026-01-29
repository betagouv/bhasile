"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { useEffect, useId, useRef } from "react";

export default function LineChart({ data, options, height = 350 }: Props) {
  const chartRef = useRef(null);
  const id = useId();
  const chartClass = `linechart-${id.replace(/:/g, "-")}`;

  useEffect(() => {
    let chart = null;
    if (chartRef.current) {
      chart = new Chartist.LineChart(chartRef.current, data, {
        ...options,
        lineSmooth: false,
      });
    }
    return () => {
      if (chart) {
        chart.detach();
      }
    };
  }, [data, options]);

  return (
    <div className={`w-full ${chartClass}`}>
      <div ref={chartRef} style={{ height }} />
      <style>
        {`
          .${chartClass} .ct-series-a .ct-point { stroke: var(--blue-france-sun-113-625) !important; }
          .${chartClass} .ct-series-a .ct-line { stroke: var(--blue-france-sun-113-625) !important; }
          .${chartClass} .ct-series-a .ct-line { stroke-width: 2px !important; }
          .${chartClass} .ct-series-b .ct-point { display: none !important; }
          .${chartClass} .ct-series-b .ct-line { stroke: var(--blue-france-main-525) !important; }
          .${chartClass} .ct-series-b .ct-line { stroke-width: 2px !important; }
          .${chartClass} .ct-series-b .ct-line { stroke-dasharray: 10,10 !important; }
          .${chartClass} .ct-series-c .ct-point { display: none !important; }
          .${chartClass} .ct-series-c .ct-line { stroke: var(--green-archipel-main-557) !important; }
          .${chartClass} .ct-series-c .ct-line { stroke-width: 2px !important; }
          .${chartClass} .ct-series-c .ct-line { stroke-dasharray: 5,5 !important; }
          .${chartClass} .ct-series-d .ct-point { display: none !important; }
          .${chartClass} .ct-series-d .ct-line { stroke: var(--purple-glycine-main-494) !important; }
          .${chartClass} .ct-series-d .ct-line { stroke-width: 2px !important; }
          .${chartClass} .ct-series-d .ct-line { stroke-dasharray: 1,5 !important; }
          .${chartClass} .ct-series-d .ct-line { stroke-linecap: round !important; }
        `}
      </style>
    </div>
  );
}

type Props = {
  data: Chartist.LineChartData;
  options: Chartist.LineChartOptions;
  height?: number;
};
