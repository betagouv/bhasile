"use client";

import { ReactElement, ReactNode, useState } from "react";

import { formatBytes } from "@/app/utils/number.util";
import type { SectionVersion } from "@/lib/tarification/tarification.section";

import { DocumentVersionDetails } from "./DocumentVersionDetails";
import { DocumentVersions } from "./DocumentVersions";
import { DocumentViewer } from "./DocumentViewer";

export const DocumentPanel = ({
  label,
  versions,
  isOperateur,
  timeZone,
  notice,
  reviewerNames,
}: Props): ReactElement => {
  const defaultVersion =
    versions.find((version) => !version.isWithdrawn) ?? versions[0];
  const [selectedVersionId, setSelectedVersionId] = useState(
    defaultVersion?.id
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const selectedVersion =
    versions.find((version) => version.id === selectedVersionId) ??
    defaultVersion;

  return (
    <div className="flex flex-col gap-4">
      <header className="bg-white rounded-xl border border-border-default-grey px-6 py-4">
        <h1 className="fr-h5 text-title-blue-france mb-0">{label}</h1>
      </header>
      {notice}
      <div className="flex gap-4 items-stretch">
        <section className="w-[26rem] shrink-0 flex flex-col gap-3 bg-white rounded-xl border border-border-default-grey p-6">
          {selectedVersion ? (
            <>
              <DocumentVersionDetails
                version={selectedVersion}
                timeZone={timeZone}
              />
              <button
                type="button"
                aria-expanded={isHistoryOpen}
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="text-sm font-medium text-title-blue-france text-left underline"
              >
                Voir l’historique des modifications
              </button>
              {isHistoryOpen && (
                <DocumentVersions
                  versions={versions}
                  selectedVersionId={selectedVersion.id}
                  timeZone={timeZone}
                  onSelect={setSelectedVersionId}
                />
              )}
              <p className="mb-0 text-xs text-mention-grey">
                {formatBytes(selectedVersion.file.fileSize)}
                {selectedVersion.file.sha256 &&
                  ` – empreinte ${selectedVersion.file.sha256}`}
              </p>
            </>
          ) : (
            <p className="mb-0 text-mention-grey">
              {isOperateur
                ? "Ce document ne vous a pas encore été envoyé."
                : "Aucun document pour l’instant."}
            </p>
          )}
        </section>
        {selectedVersion && (
          <DocumentViewer
            key={selectedVersion.id}
            file={selectedVersion.file}
            canOpen={!isOperateur || !selectedVersion.isWithdrawn}
            title={`${label} : ${selectedVersion.file.originalName}`}
          />
        )}
      </div>
      {reviewerNames.length > 0 && (
        <footer className="bg-white rounded-xl border border-border-default-grey px-6 py-4 text-sm">
          relu par <strong>{reviewerNames.join(", ")}</strong>
        </footer>
      )}
    </div>
  );
};

type Props = {
  label: string;
  versions: SectionVersion[];
  isOperateur: boolean;
  timeZone: string;
  notice?: ReactNode;
  reviewerNames: string[];
};
