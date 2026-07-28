import Link from "next/link";
import { ReactElement, ReactNode } from "react";

import { Badge } from "@/app/components/common/Badge";
import { formatDate } from "@/app/utils/date.util";
import { DashboardRappel, RappelGroupBy } from "@/types/dashboard.type";

export const RappelRow = ({ rappel, groupBy }: Props): ReactElement => {
  const showTask = groupBy !== "TASK";
  const showEntity = groupBy === "TASK" || groupBy === "CRITICITE";

  return (
    <div className="flex items-center gap-4 py-2 text-sm">
      {showTask && <span>{rappel.taskLabel}</span>}
      {showEntity && (
        <span className="min-w-0 truncate">{renderEntityLabel(rappel)}</span>
      )}

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
};

const renderEntityLabel = (rappel: DashboardRappel): ReactNode => {
  if (rappel.structureCodeBhasile) {
    return (
      <>
        <strong>{rappel.structureCodeBhasile}</strong>
        {rappel.structureCommune && (
          <span className="text-mention-grey">
            {" "}
            {rappel.structureCommune}
            {rappel.structureDepartement &&
              ` (${rappel.structureDepartement})`}
          </span>
        )}
      </>
    );
  }
  if (rappel.cpomLabel) {
    return <strong>{rappel.cpomLabel}</strong>;
  }
  return null;
};

type Props = {
  rappel: DashboardRappel;
  groupBy: RappelGroupBy;
};
