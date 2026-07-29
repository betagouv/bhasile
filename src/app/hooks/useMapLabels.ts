import { useEffect, useRef, useState } from "react";

import { ZoneLabel } from "@/types/map.type";

interface UseMapLabelsProps {
  zoneData: Record<string, number>;
  dependencyTrigger?: string;
  onPathFound?: (path: SVGPathElement, code: string) => boolean | void;
}

export const useMapLabels = ({
  zoneData,
  dependencyTrigger,
  onPathFound,
}: UseMapLabelsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const [labels, setLabels] = useState<ZoneLabel[]>([]);

  useEffect(() => {
    const clickListeners: { element: SVGPathElement; handler: () => void }[] =
      [];

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
      const newLabels: ZoneLabel[] = [];

      paths.forEach((path) => {
        const className = path.getAttribute("class") || "";
        const frClass = className
          .split(" ")
          .find((name) => name.startsWith("FR-"));

        if (frClass) {
          const code = frClass.replace("FR-", "");
          const value = zoneData[code];

          if (onPathFound) {
            const shouldInclude = onPathFound(path, code);
            if (shouldInclude === false) {
              return;
            }
          }

          if (value !== undefined) {
            const pathRect = path.getBoundingClientRect();
            newLabels.push({
              code,
              value,
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
      clickListeners.forEach(({ element, handler }) => {
        element.removeEventListener("click", handler);
      });
    };
  }, [zoneData, dependencyTrigger, onPathFound]);

  return { containerRef, mapRef, labels };
};
