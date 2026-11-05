"use client";

import { ReactElement, ReactNode, useState } from "react";

import { formatBytes } from "@/app/utils/number.util";
import { useTarificationActions } from "@/hooks/useTarificationActions";
import type { SectionActions } from "@/lib/tarification/tarification.actions";
import type { TarificationSectionCode } from "@/lib/tarification/tarification.definition";
import type { SectionVersion } from "@/lib/tarification/tarification.section";

import { DocumentActionBar } from "./DocumentActionBar";
import { DocumentDeposit } from "./DocumentDeposit";
import { DocumentVersionDetails } from "./DocumentVersionDetails";
import { DocumentVersions } from "./DocumentVersions";
import { DocumentViewer } from "./DocumentViewer";

export const DocumentPanel = ({
  structureId,
  year,
  sectionCode,
  actions,
  hasSharedL48,
  contradictoireDeadline,
  label,
  subtitle,
  versions,
  isOperateur,
  timeZone,
  notice,
  reviewerNames,
}: Props): ReactElement => {
  const defaultVersion =
    versions.find((version) => !version.isWithdrawn) ?? versions[0];
  const { depositDocument, recordEvent, respondToL48 } = useTarificationActions(
    { structureId, year }
  );
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const selectedVersion =
    versions.find((version) => version.id === selectedVersionId) ??
    defaultVersion;

  return (
    <div className="grow min-h-0 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-4 flex-wrap bg-white rounded-[10px] border border-border-default-grey pl-5 pr-3.5 py-3.5">
        <h1 className="text-xl font-bold text-title-blue-france mb-0">
          {label}
          {subtitle && (
            <span className="font-normal text-lg">{` – ${subtitle}`}</span>
          )}
        </h1>
        {selectedVersion && (
          <button
            type="button"
            aria-expanded={isHistoryOpen}
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-title-blue-france"
          >
            <span aria-hidden className="fr-icon-eye-line fr-icon--sm" />
            Voir l’historique des modifications
          </button>
        )}
      </header>
      {notice}
      <div className="grow min-h-80 flex gap-4 items-stretch">
        <section className="w-[26rem] shrink-0 overflow-y-auto flex flex-col gap-3 bg-white rounded-[10px] border border-border-default-grey p-5">
          {actions.depositOptions.length > 0 && (
            <DocumentDeposit
              options={actions.depositOptions}
              onDeposit={async (document) => {
                await depositDocument(document);
                setSelectedVersionId(null);
              }}
            />
          )}
          {selectedVersion ? (
            <>
              <DocumentVersionDetails
                version={selectedVersion}
                timeZone={timeZone}
              />
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
      <DocumentActionBar
        sectionCode={sectionCode}
        version={selectedVersion}
        versionActions={
          selectedVersion && actions.versionActions[selectedVersion.id]
        }
        canMarkNotApplicable={actions.canMarkNotApplicable}
        canRespondToL48={actions.canRespondToL48}
        reviewerNames={reviewerNames}
        hasSharedL48={hasSharedL48}
        contradictoireDeadline={contradictoireDeadline}
        recordEvent={recordEvent}
        respondToL48={respondToL48}
      />
    </div>
  );
};

type Props = {
  structureId: number;
  year: number;
  sectionCode: TarificationSectionCode;
  actions: SectionActions;
  hasSharedL48: boolean;
  contradictoireDeadline: string | null;
  label: string;
  subtitle?: string;
  versions: SectionVersion[];
  isOperateur: boolean;
  timeZone: string;
  notice?: ReactNode;
  reviewerNames: string[];
};
