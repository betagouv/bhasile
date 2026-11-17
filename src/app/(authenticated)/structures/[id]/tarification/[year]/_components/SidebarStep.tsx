import Link from "next/link";
import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";
import type { StepProgress } from "@/lib/tarification/tarification.section";
import type { StepStatus } from "@/types/tarification.type";

import { StepProgressList } from "./StepProgressList";

export const SidebarStep = ({
  label,
  href,
  status,
  isLate,
  isSelected,
  isOperateur,
  progress,
}: Props): ReactElement => {
  const isFinished = status === "DONE" || status === "NOT_APPLICABLE";

  return (
    <li
      className={cn(
        "p-0 rounded-xl",
        isSelected && "bg-active-blue-france",
        !isSelected && status === "UPCOMING" && "bg-contrast-grey",
        !isSelected && status !== "UPCOMING" && "bg-alt-blue-france"
      )}
    >
      <Link
        href={href}
        aria-current={isSelected ? "step" : undefined}
        className={cn(
          "flex items-center gap-3 px-4 py-3 font-bold bg-none!",
          isSelected && "text-white!",
          !isSelected && status === "UPCOMING" && "text-mention-grey",
          !isSelected && status !== "UPCOMING" && "text-title-blue-france"
        )}
      >
        <span aria-hidden className="fr-icon-file-text-fill" />
        <span className="grow">{label}</span>
        {status === "NOT_APPLICABLE" && (
          <span className="font-normal text-sm">Sans objet</span>
        )}
        {isFinished && <span className="fr-icon-check-line" aria-hidden />}
      </Link>
      {isLate && (
        <div className="px-4 pb-3">
          <Badge type="error">En retard</Badge>
        </div>
      )}
      {isSelected && (
        <StepProgressList progress={progress} isOperateur={isOperateur} />
      )}
    </li>
  );
};

type Props = {
  label: string;
  href: string;
  status: StepStatus;
  isLate: boolean;
  isSelected: boolean;
  isOperateur: boolean;
  progress: StepProgress;
};
