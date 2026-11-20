import { useCallback, useLayoutEffect, useRef, useState } from "react";

export const useElementHeights = (count: number) => {
  const elementsRef = useRef<(HTMLElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: count }, () => 0)
  );

  const registerElement = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      elementsRef.current[index] = element;
    },
    []
  );

  useLayoutEffect(() => {
    const elements = elementsRef.current.slice(0, count);

    const measureHeights = () => {
      const measuredHeights = Array.from(
        { length: count },
        (_, index) => elements[index]?.offsetHeight ?? 0
      );
      setHeights((currentHeights) =>
        haveSameValues(currentHeights, measuredHeights)
          ? currentHeights
          : measuredHeights
      );
    };

    measureHeights();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(measureHeights);
    elements.forEach((element) => {
      if (element) {
        resizeObserver.observe(element);
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [count]);

  return { heights, registerElement };
};

const haveSameValues = (first: number[], second: number[]): boolean =>
  first.length === second.length &&
  first.every((value, index) => value === second[index]);
