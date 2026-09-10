"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";

import { PrintableContainer } from "@/app/components/PrintableContainer";
import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";
import { usePdfExport } from "@/app/hooks/usePdfExport";
import { useUserAction } from "@/app/hooks/useUserAction";
import { formatDate } from "@/app/utils/date.util";
import { computeStartMonth, toYearMonth } from "@/app/utils/pdf-export.util";
import { downloadDocument } from "@/app/utils/spreadsheet-download/spreadsheet-download.util";
import { getStructureDownloadContent } from "@/app/utils/spreadsheet-download/structure-spreadsheet-download.util";
import { useStructureContext } from "@/contexts/StructureContext";

import { StructurePdfExportDocument } from "./StructurePdfExportDocument";

type Props = {
  structureId: number;
};

export const StructureMenu = ({ structureId }: Props) => {
  const { isPanelOpen, setIsPanelOpen, panelRef } = useButtonsPanel();
  const { structure } = useStructureContext();
  const { trackStructureSpreadsheetExport } = useUserAction();

  const { triggerExport, isExporting, printRef } = usePdfExport(
    `Structure ${structure.codeBhasile} ${formatDate(new Date()).replaceAll("_", "-")}`
  );

  const endYear = new Date().getFullYear();
  const endMonth = toYearMonth(new Date());

  const exportPayload = {
    typePlacesFinancesStartYear: endYear - 4,
    typePlacesFinancesEndYear: endYear,
    activiteStartMonth: computeStartMonth(endMonth),
    activiteEndMonth: endMonth,
  };

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <Button
        priority="tertiary no outline"
        iconId="ri-more-2-fill"
        title="Menu structure"
        onClick={() => {
          setIsPanelOpen(!isPanelOpen);
        }}
      />
      {isPanelOpen && (
        <div className="absolute top-full right-0 flex flex-col items-end bg-white shadow-md z-50">
          <Link
            href={`/structures/transformation/type?structureId=${structureId}`}
            className="whitespace-nowrap fr-btn fr-btn--tertiary-no-outline"
          >
            Extension, contraction ou fermeture
          </Link>
          <hr className="w-full" />
          <Button
            priority="tertiary no outline"
            onClick={() => {
              triggerExport();
              setIsPanelOpen(false);
            }}
            className="whitespace-nowrap"
          >
            Exporter la fiche (PDF)
          </Button>
          <Button
            priority="tertiary no outline"
            onClick={() => {
              downloadDocument(getStructureDownloadContent(structure));
              trackStructureSpreadsheetExport(structure.id);
              setIsPanelOpen(false);
            }}
            className="whitespace-nowrap"
          >
            Exporter tous les tableaux (ODS)
          </Button>
        </div>
      )}

      <PrintableContainer isExporting={isExporting} printRef={printRef}>
        <StructurePdfExportDocument data={exportPayload} />
      </PrintableContainer>
    </div>
  );
};
