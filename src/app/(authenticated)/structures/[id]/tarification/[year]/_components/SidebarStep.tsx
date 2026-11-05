import Link from "next/link";
import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";
import type { StepProgress } from "@/lib/tarification/tarification.section";
import type { StepStatus } from "@/types/tarification.type";

import { StepProgressList } from "./StepProgressList";

export const SidebarStep = ({
  label,
  subtitle,
  href,
  status,
  isLate,
  isSelected,
  isLast,
  isOperateur,
  deadline,
  timeZone,
  progress,
}: Props): ReactElement => {
  const isFinished = status === "DONE" || status === "NOT_APPLICABLE";
  const isUpcoming = status === "UPCOMING" && !isSelected;

  return (
    <li className="p-0 flex flex-col items-center">
      <div
        className={cn(
          "w-full flex flex-col gap-4 p-4 rounded-[10px]",
          isSelected &&
            "bg-action-low-blue-france border border-solid border-active-blue-france",
          !isSelected && isUpcoming && "bg-disabled-grey",
          !isSelected && !isUpcoming && "bg-alt-blue-france"
        )}
      >
        <Link
          href={href}
          aria-current={isSelected ? "step" : undefined}
          className={cn(
            "flex items-center gap-3 bg-none!",
            isUpcoming ? "text-disabled-grey!" : "text-title-blue-france!"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex items-center justify-center size-8 shrink-0 rounded-full",
              isFinished && !isSelected
                ? "bg-active-blue-france text-white"
                : "bg-white"
            )}
          >
            <span className="fr-icon-file-text-fill fr-icon--sm" />
          </span>
          <span className="grow flex flex-col gap-1">
            <span className="text-sm font-bold leading-snug">{label}</span>
            {subtitle && (
              <span className="text-xs font-normal">{subtitle}</span>
            )}
          </span>
          {status === "NOT_APPLICABLE" && (
            <span className="font-normal text-xs">Sans objet</span>
          )}
          {isFinished && (
            <span className="fr-icon-check-line fr-icon--sm" aria-hidden />
          )}
          {!isFinished && isSelected && (
            <span className="fr-icon-refresh-line fr-icon--sm" aria-hidden />
          )}
        </Link>
        {isLate && <Badge type="error">En retard</Badge>}
        {isSelected && (
          <StepProgressList
            progress={progress}
            isOperateur={isOperateur}
            deadline={deadline}
            timeZone={timeZone}
          />
        )}
      </div>
      {!isLast && (
        <span
          aria-hidden
          className={cn(
            "w-1.5 h-3.5",
            isFinished ? "bg-active-blue-france" : "bg-disabled-grey"
          )}
        />
      )}
    </li>
  );
};

type Props = {
  label: string;
  subtitle?: string;
  href: string;
  status: StepStatus;
  isLate: boolean;
  isSelected: boolean;
  isLast: boolean;
  isOperateur: boolean;
  deadline: string | null;
  timeZone: string;
  progress: StepProgress;
};
