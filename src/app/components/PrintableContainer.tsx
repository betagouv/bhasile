import { PropsWithChildren, ReactElement, RefObject } from "react";

import { ExportContext } from "@/contexts/ExportContext";

export const PrintableContainer = ({
  children,
  isExporting,
  printRef,
}: Props): ReactElement => (
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
              @page {
                size: portrait;
              }
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

type Props = PropsWithChildren<{
  isExporting: boolean;
  printRef: RefObject<HTMLDivElement | null>;
}>;
