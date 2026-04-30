import Tag from "@codegouvfr/react-dsfr/Tag";
import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/app/utils/classname.util";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";
import { StepStatus } from "@/types/form.type";

import { useStructureContext } from "../../_context/StructureClientContext";

export const Tab = ({ title, route, current, type }: Props) => {
  const { structure } = useStructureContext();

  const currentFormStepStatus = getFinalisationFormStepStatus(route, structure);

  return (
    <Link
      href={`/structures/${structure.id}/finalisation/${route}`}
      className={cn(
        "h-full flex flex-col justify-between py-3 pr-3 pl-5 border-default-grey border rounded-t-sm",
        current
          ? "bg-white border-b-0"
          : "bg-alt-blue-france hover:bg-alt-blue-france-hover"
      )}
    >
      <span className="flex justify-between mb-2 text-title-blue-france">
        <strong>{title}</strong>
        <span className="fr-icon-arrow-right-line"></span>
      </span>
      {currentFormStepStatus === StepStatus.VALIDE && (
        <Tag
          className="!bg-[var(--success-950-100)] !text-[var(---success-425-625)] font-bold"
          iconId="fr-icon-check-line"
          small
        >
          {type === "verification" ? "VÉRIFIÉ" : "COMPLÉTÉ"}
        </Tag>
      )}
      {currentFormStepStatus === StepStatus.A_VERIFIER && (
        <Tag
          className="!bg-[var(--color-background-contrast-yellow-tournesol)] !text-[var(--color-text-action-high-yellow-tournesol)] font-bold"
          iconId="fr-icon-eye-line"
          small
        >
          À VÉRIFIER
        </Tag>
      )}
      {currentFormStepStatus === StepStatus.NON_COMMENCE && (
        <Tag
          className="!bg-[var(--color-background-contrast-warning)]  !text-[var(--color-text-default-warning)] font-bold"
          iconId="fr-icon-eye-line"
          small
        >
          À COMPLÉTER
        </Tag>
      )}
    </Link>
  );
};

type Props = {
  title: ReactNode;
  route: string;
  current: boolean;
  type: "verification" | "completion";
};
