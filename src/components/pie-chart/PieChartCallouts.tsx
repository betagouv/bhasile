import { PropsWithChildren, ReactNode } from "react";

import { useElementHeights } from "@/hooks/useElementHeights";
import { computeCalloutLayout } from "@/utils/pie-chart.util";

import { CalloutLine } from "./CalloutLine";

const LABEL_OFFSET_X = 24;
const LABEL_TEXT_INDENT = 6;
const LABEL_GAP = 8;
const FIRST_LINE_CENTER = 12;

export const PieChartCallouts = ({
  values,
  labels,
  size,
  donutWidth,
  calloutWidth,
  children,
}: Props) => {
  const { heights, registerElement } = useElementHeights(labels.length);
  const labelX = size + LABEL_OFFSET_X;
  const layout = computeCalloutLayout({
    values,
    size,
    donutWidth,
    labelHeights: heights,
    labelX,
    labelGap: LABEL_GAP,
    firstLineCenter: FIRST_LINE_CENTER,
  });
  const width = labelX + calloutWidth;

  return (
    <div className="relative" style={{ width, height: layout.height }}>
      <div className="absolute left-0" style={{ top: layout.chartTop }}>
        {children}
      </div>
      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        width={width}
        height={layout.height}
        aria-hidden="true"
      >
        {layout.items.map(({ line }, index) =>
          line ? <CalloutLine key={index} line={line} /> : null
        )}
      </svg>
      {labels.map((label, index) => (
        <div
          key={index}
          ref={registerElement(index)}
          className="absolute"
          style={{
            left: labelX + LABEL_TEXT_INDENT,
            top: layout.items[index]?.top ?? 0,
            width: calloutWidth - LABEL_TEXT_INDENT,
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

type Props = PropsWithChildren<{
  values: number[];
  labels: ReactNode[];
  size: number;
  donutWidth?: number;
  calloutWidth: number;
}>;
