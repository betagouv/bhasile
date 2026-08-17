import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";
import { downloadDocument } from "@/app/utils/spreadsheet-download.util";

export const DocumentDownloadDropdown = ({
  downloadContent,
}: Props): ReactElement => {
  const { isPanelOpen, setIsPanelOpen, panelRef } = useButtonsPanel();

  return (
    <div className="relative" ref={panelRef}>
      <Button
        priority="tertiary"
        iconId="fr-icon-download-line"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        title="Menu de téléchargement"
      />
      {isPanelOpen && (
        <div className="absolute top-full right-0 flex flex-col items-end bg-white shadow-md z-50">
          <Button
            priority="tertiary no outline"
            onClick={() => {
              downloadDocument(downloadContent);
            }}
            className="whitespace-nowrap"
            disabled={
              !downloadContent.data || downloadContent.data.length === 0
            }
          >
            Exporter le tableau (ODS)
          </Button>
        </div>
      )}
    </div>
  );
};

type Props = {
  downloadContent: {
    fileName: string;
    sheetName: string;
    data: Record<string, string | number | null>[];
    headersMap: Record<string, string>;
  };
};
