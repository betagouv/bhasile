"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReactToPrint } from "react-to-print";

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

  return {
    triggerExport,
    isExporting,
    printRef,
  };
};
