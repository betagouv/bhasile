"use client";

import { ReactElement, useEffect, useRef } from "react";

export const CpomHeader = (): ReactElement | null => {
  const structureHeaderRef = useRef<HTMLDivElement>(null);
  const structureHeaderHeight = useRef(0);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (structureHeaderRef.current) {
        const height = structureHeaderRef.current.offsetHeight;
        structureHeaderHeight.current = height;
        document.documentElement.style.setProperty(
          "--structure-header-height",
          `${height}px`
        );
      }
    };

    updateHeaderHeight();

    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <div className="sticky top-0 z-2 bg-lifted-grey" ref={structureHeaderRef}>
      <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center">
        <div>
          <h2 className="text-title-blue-france text-xs uppercase mb-0">
            <strong className="pr-3">Ajouter un cpom</strong>
          </h2>
          <h3 className="text-title-blue-france fr-h6 mb-0">
            <strong className="pr-2">Nouveau CPOM</strong>
          </h3>
        </div>
      </div>
    </div>
  );
};
