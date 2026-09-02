"use client";

import { ReactElement, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReactToPrint } from "react-to-print";

import { ExportContext } from "@/contexts/ExportContext";

import {
  PdfExportDocument,
  PdfExportPayload,
} from "../(authenticated)/(with-menu)/structures/[id]/_components/_header/PdfExportDocument";
import { formatDate } from "../utils/date.util";

export const usePdfExport = (codeBhasile: string | undefined) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const triggerExport = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Structure ${codeBhasile} ${formatDate(new Date()).replaceAll("_", "-")}`,
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
    data,
  }: {
    data: PdfExportPayload;
  }): ReactElement => (
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
          <PdfExportDocument data={data} />
        </div>
      </ExportContext.Provider>
    </div>
  );

  return {
    triggerExport,
    PrintableContainer,
  };
};
