"use client";

import "chartist/dist/index.css";

import * as Chartist from "chartist";
import { ReactNode, useEffect, useId, useRef } from "react";

import { ChartAxisLabels } from "@/app/components/common/ChartAxisLabels";
import { withCompactAxisY } from "@/app/utils/chart.util";

const defaultColors = [
  "var(--yellow-moutarde-850-200)",
  "var(--yellow-moutarde-main-679)",
  "var(--purple-glycine-850-200)",
  "var(--blue-cumulus-850-200)",
];

export default function BarChart({
  data,
  options,
  colors = defaultColors,
  axisYLabel,
  incompleteYears,
  renderLabel,
}: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const chartClass = `barchart-${id.replace(/:/g, "-")}`;

  useEffect(() => {
    let chart: Chartist.BarChart | null = null;

    if (chartRef.current) {
      const chartOptions: Chartist.BarChartOptions = {
        height: "340px",
        width: "100%",
        ...withCompactAxisY({
          ...options,
          axisX: {
            ...options?.axisX,
            showLabel: !renderLabel,
          },
        }),
      };

      chart = new Chartist.BarChart(chartRef.current, data, chartOptions);

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
  }, [data, options, renderLabel]);

  const totalColumns = data.labels?.length ?? 0;

  return (
    <div className={`${chartClass} w-full`}>
      <ChartAxisLabels startLabel={axisYLabel} />
      <div style={{ position: "relative", height: 340 }} className="w-full">
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 50,
            right: 0,
            bottom: 0,
            display: "flex",
            pointerEvents: "none",
          }}
        >
          {data.labels?.map((_, index) => {
            const isIncomplete = incompleteYears?.[index] ?? false;
            return (
              <div
                key={`background-column-${index}`}
                style={{
                  flex: 1,
                  backgroundColor: isIncomplete
                    ? "var(--color-background-default-grey-active)"
                    : "transparent",
                }}
              />
            );
          })}
        </div>

        <div
          ref={chartRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {renderLabel && totalColumns > 0 && (
        <div
          style={{
            display: "flex",
            paddingLeft: 50,
            marginTop: 8,
          }}
        >
          {data.labels?.map((label, index) => (
            <div
              key={`custom-label-${index}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {renderLabel(String(label), index)}
            </div>
          ))}
        </div>
      )}

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
  axisYLabel?: string;
  incompleteYears?: boolean[];
  renderLabel?: (label: string, index: number) => ReactNode;
};
