import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";
import { downloadDocument } from "@/app/utils/spreadsheet-download.util";
import { DownloadOptions } from "@/types/spreadsheet-download.type";

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
              !downloadContent.data?.length && !downloadContent.sheets?.length
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
  downloadContent: DownloadOptions;
};
