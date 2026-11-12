"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useId, useRef, useState } from "react";

import { useSaveMutation } from "@/app/hooks/useSaveMutation";
import { cn } from "@/app/utils/classname.util";
import { endOfMonthUtcFromMonthKey, formatDate } from "@/app/utils/date.util";
import { formatPlural } from "@/app/utils/string.util";
import { FileBox } from "@/components/FileBox";
import { FileBrowseButton } from "@/components/FileBrowseButton";
import { MonthSelect } from "@/components/MonthSelect";
import { SPREADSHEET_MIME_TYPES } from "@/constants";
import { useFetchState } from "@/contexts/FetchStateContext";
import { useSpreadsheetImport } from "@/hooks/useSpreadsheetImport";
import { FetchState } from "@/types/fetch-state.type";
import { ImportPreview, ImportResult } from "@/types/import.type";
import { FILE_TOO_LARGE_MESSAGE, isFileTooLarge } from "@/utils/upload.util";

export const SpreadsheetImport = ({
  endpoint,
  label,
  intro,
  exampleHref,
  withMonth = false,
}: Props): ReactElement => {
  const { previewImport, applyImport } = useSpreadsheetImport(endpoint);
  const { getFetchState } = useFetchState();
  const labelId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  const saveKey = `${endpoint}-save`;
  const { mutate: importFile } = useSaveMutation(saveKey, applyImport, {
    shouldRefresh: false,
  });
  const isImporting = getFetchState(saveKey) === FetchState.LOADING;

  const checkFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(null);
    setPreviewError(null);
    setResult(null);
    if (isFileTooLarge(selectedFile.size)) {
      setPreviewError(FILE_TOO_LARGE_MESSAGE);
      return;
    }
    setIsChecking(true);
    try {
      const nextPreview = await previewImport(selectedFile);
      setPreview(nextPreview);
      setMonth(nextPreview.detectedMonth ?? null);
      setCheckCount((count) => count + 1);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsChecking(false);
    }
  };

  const confirmImport = async () => {
    if (file) {
      setResult(await importFile(file, withMonth ? month : null));
    }
  };

  const status = isChecking
    ? "Vérification du fichier…"
    : (previewError ?? file?.name ?? "Pas de fichier");

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <p className="mb-0">{intro}</p>
      {exampleHref && (
        <a
          href={exampleHref}
          download
          className="fr-link fr-icon-download-line fr-link--icon-left self-start"
        >
          Télécharger un fichier d’exemple
        </a>
      )}
      <div>
        <p id={labelId} className="font-bold mb-2">
          {label}
        </p>
        <FileBox
          inputRef={inputRef}
          accept={SPREADSHEET_MIME_TYPES.join(",")}
          onFileSelected={checkFile}
          ariaLabelledBy={labelId}
          errorMessage={previewError ?? undefined}
        >
          <span className="flex items-center justify-center gap-4">
            <span className={cn(previewError && "fr-error-text mt-0")}>
              {status}
            </span>
            <FileBrowseButton
              onClick={() => inputRef.current?.click()}
              isLoading={isChecking}
              accessibleLabel={label}
              describedBy={statusId}
            />
          </span>
          <span id={statusId} className="fr-sr-only" aria-live="polite">
            {status}
          </span>
        </FileBox>
      </div>

      {preview && preview.errors.length > 0 && (
        <Alert
          severity="error"
          title={`${formatPlural(preview.errors.length, "ligne")} à corriger`}
          description={
            <>
              <p>
                Corrigez le fichier puis chargez-le à nouveau. Rien n’a été
                importé.
              </p>
              <ul>
                {preview.errors.map(({ key, issues }, index) => (
                  <li key={`${key}-${index}`}>
                    {key} : {issues.join(", ")}
                  </li>
                ))}
              </ul>
            </>
          }
        />
      )}

      {preview && preview.errors.length === 0 && !result && (
        <>
          <Alert
            severity="info"
            title="Prévisualisation de l’import"
            description={
              <>
                <p>{preview.summary} :</p>
                <ul>
                  {preview.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </>
            }
          />
          {withMonth && (
            <MonthSelect
              key={checkCount}
              initialValue={preview.detectedMonth ?? null}
              hint={
                preview.detectedMonth
                  ? "Mois détecté dans le fichier : vérifiez-le avant d’importer."
                  : "Le mois n’a pas pu être déduit du fichier : merci de l’indiquer."
              }
              onChange={setMonth}
            />
          )}
          <div>
            <Button
              disabled={isImporting || (withMonth && !month)}
              onClick={confirmImport}
            >
              {withMonth && month
                ? `Confirmer l’import pour ${formatMonth(month)}`
                : "Confirmer l’import"}
            </Button>
          </div>
        </>
      )}

      {result && (
        <Alert
          severity="success"
          title="Import terminé"
          description={result.summary}
        />
      )}
    </div>
  );
};

const formatMonth = (month: string): string =>
  formatDate(endOfMonthUtcFromMonthKey(month), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

type Props = {
  endpoint: string;
  label: string;
  intro: string;
  exampleHref?: string;
  withMonth?: boolean;
};
