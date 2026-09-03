import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";

import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";
import { useUserAction } from "@/app/hooks/useUserAction";
import { downloadDocument } from "@/app/utils/spreadsheet-download/spreadsheet-download.util";
import { getStructureDownloadContent } from "@/app/utils/spreadsheet-download/structure-spreadsheet-download.util";
import { useStructureContext } from "@/contexts/StructureContext";

import { PdfExportModal, pdfExportModal } from "./PdfExportModal";

export const StructureMenu = ({ structureId }: Props) => {
  const { isPanelOpen, setIsPanelOpen, panelRef } = useButtonsPanel();
  const { structure } = useStructureContext();
  const { trackStructureSpreadsheetExport } = useUserAction();

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
            onClick={() => pdfExportModal.open()}
            className="whitespace-nowrap"
          >
            Exporter la fiche (PDF)
          </Button>
          <Button
            priority="tertiary no outline"
            onClick={() => {
              downloadDocument(getStructureDownloadContent(structure));
              trackStructureSpreadsheetExport(structure.id);
            }}
            className="whitespace-nowrap"
          >
            Exporter tous les tableaux (ODS)
          </Button>
        </div>
      )}
      <PdfExportModal />
    </div>
  );
};

type Props = {
  structureId: number;
};
