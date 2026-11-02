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
import { SidebarStep } from "./SidebarStep";

export const TarificationSidebar = ({
  structureId,
  year,
  campaignYears,
  selectedCode,
  isOperateur,
  drlUrl,
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
    <aside className="w-[25rem] shrink-0 flex flex-col gap-4 bg-white border-r border-r-border-default-grey px-5 py-4">
      <Image
        src="/logo.svg"
        alt="Bhasile"
        width={100}
        height={40}
        className="self-center"
      />
      <CampaignSelect
        structureId={structureId}
        year={year}
        campaignYears={campaignYears}
      />

      <nav aria-label="Documents préliminaires">
        <h2 className="text-title-blue-france text-sm uppercase font-bold mb-2">
          Documents préliminaires
        </h2>
        <ul className="fr-raw-list p-0 m-0 flex flex-col gap-2">
          {drlUrl && (
            <li className="p-0">
              <a
                href={drlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-alt-blue-france px-4 py-2 text-sm font-medium text-title-blue-france"
              >
                Dotation Régionale Limitative {year}
              </a>
            </li>
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
        </ul>
      </nav>

      <nav aria-label="Parcours de tarification">
        <h2 className="text-title-blue-france text-sm uppercase font-bold mb-2">
          Parcours de tarification
        </h2>
        <ol className="fr-raw-list p-0 m-0 flex flex-col gap-3">
          {steps.map((step) => (
            <SidebarStep
              key={step.code}
              label={step.label}
              href={getSectionHref(step.code)}
              status={step.status}
              isLate={step.isLate}
              isSelected={step.code === selectedCode}
              isOperateur={isOperateur}
              progress={step.progress}
            />
          ))}
        </ol>
      </nav>

      <a
        href={BHASILE_HELP_CENTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-question-line fr-btn--icon-left self-center mt-auto"
      >
        Centre d’aide
      </a>
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
  preliminarySections: {
    code: TarificationSectionCode;
    label: string;
    isLate: boolean;
  }[];
  steps: {
    code: TarificationStepCode;
    label: string;
    status: StepStatus;
    isLate: boolean;
    progress: StepProgress;
  }[];
};
