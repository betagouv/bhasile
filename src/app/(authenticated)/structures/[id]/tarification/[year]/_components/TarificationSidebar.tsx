"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { BHASILE_HELP_CENTER_URL } from "@/constants";
import { TarificationStepCode } from "@/generated/prisma/enums";
import type { TarificationSectionCode } from "@/lib/tarification/tarification.definition";
import type { StepProgress } from "@/lib/tarification/tarification.section";
import type { StepStatus } from "@/types/tarification.type";

import { CampaignSelect } from "./CampaignSelect";
import { PreliminarySectionLink } from "./PreliminarySectionLink";
import { PreparatoryDocuments } from "./PreparatoryDocuments";
import { SidebarStep } from "./SidebarStep";

export const TarificationSidebar = ({
  structureId,
  year,
  campaignYears,
  selectedCode,
  isOperateur,
  drlUrl,
  timeZone,
  preliminarySections,
  steps,
}: Props): ReactElement => {
  const searchParams = useSearchParams();

  const getSectionHref = (code: TarificationSectionCode): string => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(SECTION_PARAM, code);
    return `?${params.toString()}`;
  };

  return (
    <aside className="w-[22rem] shrink-0 sticky top-0 h-dvh flex flex-col bg-white border-r border-r-border-default-grey">
      <div className="h-[4.5rem] shrink-0 flex items-center justify-center border-b border-b-border-default-grey">
        <Image src="/logo.svg" alt="Bhasile" width={72} height={26} />
      </div>
      <div className="shrink-0 p-4 shadow-[0_2px_3px_rgba(0,0,18,0.16)] z-10">
        <CampaignSelect
          structureId={structureId}
          year={year}
          campaignYears={campaignYears}
        />
      </div>

      <div className="grow min-h-0 overflow-y-auto flex flex-col gap-4 p-4">
        <PreparatoryDocuments
          isInitiallyOpen={preliminarySections.some(
            (section) => section.code === selectedCode || section.isLate
          )}
        >
          {drlUrl && (
            <PreliminarySectionLink
              label={`Dotation Régionale Limitative ${year}`}
              href={drlUrl}
              isExternal
            />
          )}
          {preliminarySections.map((section) => (
            <PreliminarySectionLink
              key={section.code}
              label={section.label}
              href={getSectionHref(section.code)}
              isSelected={section.code === selectedCode}
              isLate={section.isLate}
            />
          ))}
        </PreparatoryDocuments>
        <div aria-hidden className="shrink-0 h-px bg-[var(--border-default-grey)]" />

        <nav aria-label="Parcours de tarification">
          <h2 className="text-title-blue-france text-xs uppercase font-bold mb-4">
            Parcours de tarification
          </h2>
          <ol className="fr-raw-list p-0 m-0 flex flex-col">
            {steps.map((step, stepIndex) => (
              <SidebarStep
                key={step.code}
                label={step.label}
                subtitle={step.subtitle}
                href={getSectionHref(step.code)}
                status={step.status}
                isLate={step.isLate}
                isSelected={step.code === selectedCode}
                isLast={stepIndex === steps.length - 1}
                isOperateur={isOperateur}
                deadline={step.deadline}
                timeZone={timeZone}
                progress={step.progress}
              />
            ))}
          </ol>
        </nav>
      </div>

      <div className="shrink-0 flex justify-center py-6 shadow-[0_-2px_3px_rgba(0,0,18,0.16)] z-10">
        <a
          href={BHASILE_HELP_CENTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-question-line fr-btn--icon-left"
        >
          Centre d’aide
        </a>
      </div>
    </aside>
  );
};

const SECTION_PARAM = "etape";

type Props = {
  structureId: number;
  year: number;
  campaignYears: number[];
  selectedCode: TarificationSectionCode;
  isOperateur: boolean;
  drlUrl: string | null;
  timeZone: string;
  preliminarySections: {
    code: TarificationSectionCode;
    label: string;
    isLate: boolean;
  }[];
  steps: {
    code: TarificationStepCode;
    label: string;
    subtitle?: string;
    status: StepStatus;
    isLate: boolean;
    deadline: string | null;
    progress: StepProgress;
  }[];
};
