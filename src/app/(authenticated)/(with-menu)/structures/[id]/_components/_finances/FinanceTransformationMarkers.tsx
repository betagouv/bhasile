"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { FinanceTransformationMarkerBadge } from "./FinanceTransformationMarkerBadge";
import { FinanceTransformationMarker } from "./getFinanceTransformationMarkers";

type Layout = {
  columns: Map<number, number>;
  headerCenter: number;
};

export const FinanceTransformationMarkers = ({ markers, years }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  useLayoutEffect(() => {
    const scroller = rootRef.current?.parentElement;
    if (!scroller) {
      return;
    }

    const measure = () => {
      const cells = scroller.querySelectorAll<HTMLTableCellElement>(
        "thead tr:last-child th[data-year]"
      );
      const columns = new Map<number, number>();
      cells.forEach((cell) => {
        columns.set(Number(cell.dataset.year), cell.offsetLeft);
      });
      const thead = scroller.querySelector("thead");
      setLayout({
        columns,
        headerCenter: (thead?.offsetHeight ?? 0) / 2,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    const table = scroller.querySelector("table");
    if (table) {
      observer.observe(table);
    }
    return () => observer.disconnect();
  }, [markers, years]);

  return (
    <div ref={rootRef}>
      {layout &&
        markers.map((marker) => {
          const left = layout.columns.get(marker.year);
          if (left === undefined) {
            return null;
          }
          return (
            <div key={marker.year}>
              <span
                aria-hidden
                className="absolute top-0 bottom-0 z-50 w-[1.5px] bg-[radial-gradient(circle,#6b7cff_0.5px,transparent_1px)] bg-[length:1.5px_5px] bg-repeat-y bg-top"
                style={{ left }}
              />
              <span
                className="absolute z-50 -translate-x-1/2 -translate-y-1/2"
                style={{ left, top: layout.headerCenter }}
              >
                <FinanceTransformationMarkerBadge marker={marker} />
              </span>
            </div>
          );
        })}
    </div>
  );
};

type Props = {
  markers: FinanceTransformationMarker[];
  years: number[];
};
