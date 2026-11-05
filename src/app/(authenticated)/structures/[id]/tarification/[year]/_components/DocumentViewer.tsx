"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useState } from "react";

import { useFileUpload } from "@/app/hooks/useFileUpload";
import {
  INLINE_VIEWABLE_MIME_TYPES,
  SPREADSHEET_PREVIEW_MIME_TYPES,
} from "@/constants";
import {
  parseSpreadsheetPreview,
  type SpreadsheetPreviewSheet,
} from "@/utils/spreadsheet-preview.util";

import { SpreadsheetPreview } from "./SpreadsheetPreview";

export const DocumentViewer = ({
  file,
  canOpen,
  title,
}: Props): ReactElement => {
  const { getDownloadLink, getFileContent, getInlineLink } = useFileUpload();
  const [inlineLink, setInlineLink] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SpreadsheetPreviewSheet[] | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [hasOpeningError, setHasOpeningError] = useState(false);

  const isInlineViewable = INLINE_VIEWABLE_MIME_TYPES.includes(file.mimeType);
  const isSpreadsheet = SPREADSHEET_PREVIEW_MIME_TYPES.includes(file.mimeType);

  const openDocument = async () => {
    setHasOpeningError(false);
    setIsOpening(true);
    try {
      if (isSpreadsheet) {
        setSheets(
          await parseSpreadsheetPreview(await getFileContent(file.key))
        );
      } else {
        setInlineLink(await getInlineLink(file.key));
      }
    } catch {
      setHasOpeningError(true);
    } finally {
      setIsOpening(false);
    }
  };

  const downloadDocument = async () => {
    setHasOpeningError(false);
    try {
      const link = await getDownloadLink(file.key);
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {
      setHasOpeningError(true);
    }
  };

  if (!canOpen) {
    return (
      <div className="grow flex items-center justify-center bg-white rounded-xl p-6">
        <p className="mb-0 text-mention-grey">
          Ce document a été retiré : il ne peut plus être ouvert.
        </p>
      </div>
    );
  }

  return (
    <div className="grow flex flex-col gap-3 min-w-0 min-h-0">
      <div className="flex justify-end">
        <Button
          priority="tertiary"
          size="small"
          iconId="fr-icon-download-line"
          onClick={downloadDocument}
        >
          Télécharger
        </Button>
      </div>
      {sheets && <SpreadsheetPreview sheets={sheets} />}
      {inlineLink && (
        <iframe
          src={inlineLink}
          title={title}
          referrerPolicy="no-referrer"
          className="w-full grow min-h-0 bg-white rounded-xl border border-border-default-grey"
        />
      )}
      {!sheets && !inlineLink && (
        <div className="grow min-h-0 flex flex-col items-center justify-center gap-3 bg-white rounded-xl p-6">
          <p className="mb-0 font-medium">{file.originalName}</p>
          {isInlineViewable || isSpreadsheet ? (
            <Button onClick={openDocument} disabled={isOpening}>
              {isOpening ? "Ouverture…" : "Ouvrir le document"}
            </Button>
          ) : (
            <p className="mb-0 text-mention-grey">
              Aperçu indisponible pour ce format : téléchargez le document.
            </p>
          )}
        </div>
      )}
      {hasOpeningError && (
        <p role="alert" className="mb-0 text-sm text-default-error">
          Le fichier n’a pas pu être ouvert. Réessayez, ou téléchargez-le.
        </p>
      )}
    </div>
  );
};

type Props = {
  file: { key: string; originalName: string; mimeType: string };
  canOpen: boolean;
  title: string;
};
