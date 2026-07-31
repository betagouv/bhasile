import { useEffect, useRef, useState } from "react";

import { ZoneDataInfo, ZoneLabelWithTrend } from "@/types/map.type";

export const useMapLabels = ({
  zoneData,
  dependencyTrigger,
  onPathFound,
}: UseMapLabelsArgs) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const [labels, setLabels] = useState<ZoneLabelWithTrend[]>([]);

  useEffect(() => {
    const calculatePositions = () => {
      if (!mapRef.current || !containerRef.current) {
        return;
      }

      const root = mapRef.current.shadowRoot || mapRef.current;
      const paths = root.querySelectorAll<SVGPathElement>("path");

      if (paths.length === 0) {
        requestAnimationFrame(calculatePositions);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLabels: ZoneLabelWithTrend[] = [];

      paths.forEach((path) => {
        const className = path.getAttribute("class") || "";
        const frClass = className
          .split(" ")
          .find((name) => name.startsWith("FR-"));

        if (frClass) {
          const code = frClass.replace("FR-", "");
          const zoneInfo = zoneData[code];

          if (onPathFound) {
            const shouldInclude = onPathFound(path, code);
            if (shouldInclude === false) {
              return;
            }
          }

          if (zoneInfo !== undefined) {
            const pathRect = path.getBoundingClientRect();
            newLabels.push({
              code,
              value: zoneInfo.value,
              delta: zoneInfo.delta,
              direction: zoneInfo.direction,
              x: pathRect.left - containerRect.left + pathRect.width / 2,
              y: pathRect.top - containerRect.top + pathRect.height / 2,
            });
          }
        }
      });

      setLabels(newLabels);
    };

    const timeoutId = setTimeout(calculatePositions, 300);

    const resizeObserver = new ResizeObserver(() => calculatePositions());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [zoneData, dependencyTrigger, onPathFound]);

  return { containerRef, mapRef, labels };
};

type UseMapLabelsArgs = {
  zoneData: Record<string, ZoneDataInfo>;
  dependencyTrigger?: string;
  onPathFound?: (path: SVGPathElement, code: string) => boolean | void;
};
