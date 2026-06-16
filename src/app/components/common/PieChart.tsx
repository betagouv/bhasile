"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { PropsWithChildren, useEffect, useId, useRef } from "react";

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
  const chartRef = useRef(null);
  const id = useId();
  const chartClass = `piechart-${id.replace(/:/g, "-")}`;

  useEffect(() => {
    let chart = null;
    if (chartRef.current) {
      chart = new Chartist.PieChart(chartRef.current, data, options);
    }
    return () => {
      if (chart) {
        chart.detach();
      }
    };
  }, [data, options]);

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
    <div className={`${chartClass} relative`}>
      <div ref={chartRef} style={{ height: size }} />
      {children}
      <style>{isDonut ? getDonutColors() : getPieColors()}</style>
    </div>
  );
}

type Props = PropsWithChildren<{
  data: Chartist.PieChartData;
  options: Chartist.PieChartOptions;
  size?: number;
  colors?: string[];
  isDonut?: boolean;
}>;
