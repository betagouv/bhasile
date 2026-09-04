"use client";

import { PropsWithChildren, ReactElement, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReactToPrint } from "react-to-print";

import { ExportContext } from "@/contexts/ExportContext";

export const usePdfExport = (documentTitle: string | undefined) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const triggerExport = useReactToPrint({
    contentRef: printRef,
    documentTitle,
    onBeforePrint: () => {
      return new Promise((resolve) => {
        flushSync(() => {
          setIsExporting(true);
        });
        setTimeout(resolve, 250);
      });
    },
    onAfterPrint: () => {
      setIsExporting(false);
    },
  });

  const PrintableContainer = ({
    children,
  }: PropsWithChildren): ReactElement => (
    <div
      className={
        isExporting
          ? "fixed top-0 left-0 w-[210mm] opacity-0 pointer-events-none z-[-1]"
          : "hidden"
      }
      aria-hidden="true"
    >
      <ExportContext.Provider value={isExporting}>
        <div ref={printRef}>
          <style>{`
            @media print {
              body {
                zoom: 80%;
              }
            }
          `}</style>
          {children}
        </div>
      </ExportContext.Provider>
    </div>
  );

  return {
    triggerExport,
    PrintableContainer,
  };
};
