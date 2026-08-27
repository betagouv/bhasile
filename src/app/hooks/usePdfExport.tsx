"use client";

import { ReactElement, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReactToPrint } from "react-to-print";

import { ExportContext } from "@/contexts/PrintContext";

import {
  PdfExportDocument,
  PdfExportPayload,
} from "../(authenticated)/(with-menu)/structures/[id]/_components/_header/PdfExportDocument";

export const usePdfExport = (codeBhasile: string | undefined) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const triggerExport = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Fiche de la structure ${codeBhasile}`,
    onBeforePrint: () => {
      return new Promise((resolve) => {
        flushSync(() => {
          setIsExporting(true);
        });
        setTimeout(resolve, 100);
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
    <div className="hidden print:block">
      <ExportContext.Provider value={isExporting}>
        <div ref={printRef}>
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
