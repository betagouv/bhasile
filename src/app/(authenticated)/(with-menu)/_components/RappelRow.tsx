import Link from "next/link";
import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { formatDate } from "@/app/utils/date.util";
import { DashboardRappel } from "@/types/dashboard.type";

type Props = {
  rappel: DashboardRappel;
};

export const RappelRow = ({ rappel }: Props): ReactElement => (
  <div className="flex items-center gap-4 py-2 text-sm">
    <span>{rappel.taskLabel}</span>

    {rappel.deadline && (
      <Badge type={rappel.criticite === "URGENT" ? "warning" : "yellow"}>
        AVANT LE {formatDate(rappel.deadline)}
      </Badge>
    )}

    <Link href={rappel.actionUrl} aria-label="Ouvrir la fiche">
      <span className="fr-icon-arrow-right-line text-title-blue-france" />
    </Link>
  </div>
);
