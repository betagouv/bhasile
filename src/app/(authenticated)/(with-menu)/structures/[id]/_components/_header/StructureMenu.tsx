import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";

import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";
import { useUserAction } from "@/app/hooks/useUserAction";
import {
  downloadDocument,
  getStructureDownloadContent,
} from "@/app/utils/spreadsheet-download.util";
import { useStructureContext } from "@/contexts/StructureContext";

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
    </div>
  );
};

type Props = {
  structureId: number;
};
