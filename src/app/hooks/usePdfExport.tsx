"use client";

import { ReactElement, useRef } from "react";
import { useReactToPrint } from "react-to-print";

import {
  PdfExportDocument,
  PdfExportPayload,
} from "../(authenticated)/(with-menu)/structures/[id]/_components/_header/PdfExportDocument";

export const usePdfExport = (codeBhasile: string | undefined) => {
  const printRef = useRef<HTMLDivElement>(null);

  const triggerExport = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Fiche de la structure ${codeBhasile}`,
  });

  const PrintableContainer = ({
    data,
  }: {
    data: PdfExportPayload;
  }): ReactElement => (
    <div className="hidden print:block">
      <div ref={printRef}>
        <PdfExportDocument data={data} />
      </div>
    </div>
  );

  return {
    triggerExport,
    PrintableContainer,
  };
};
