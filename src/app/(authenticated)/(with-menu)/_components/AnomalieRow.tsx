import Link from "next/link";
import { ReactElement, ReactNode } from "react";

import { formatAnomalieLabel } from "@/app/utils/anomalie.util";
import { ANOMALIE_NO_YEAR } from "@/types/anomalie.type";
import { AnomalieGroupBy, DashboardAnomalie } from "@/types/dashboard.type";

export const AnomalieRow = ({
  anomalie,
  groupBy,
  isSaving,
  onIgnore,
  onReopen,
}: Props): ReactElement => {
  const isIgnored = anomalie.isJustified === true;

  return (
    <div className="py-2 text-sm">
      <div className="flex items-center gap-4">
        <span
          className={`min-w-0 grow ${isIgnored ? "text-mention-grey" : ""}`}
        >
          {groupBy === "STRUCTURE"
            ? formatAnomalieLabel(anomalie)
            : renderStructureLabel(anomalie)}
        </span>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => (isIgnored ? onReopen(anomalie) : onIgnore(anomalie))}
          className="shrink-0 text-mention-grey hover:underline disabled:opacity-50"
        >
          {isIgnored ? "Redéclarer l’anomalie" : "Ignorer et justifier"}
        </button>

        {anomalie.actionUrl && (
          <Link
            href={anomalie.actionUrl}
            className="shrink-0 flex items-center gap-1 font-bold text-title-blue-france"
          >
            Examiner
            <span className="fr-icon-arrow-right-line" aria-hidden="true" />
          </Link>
        )}
      </div>

      {isIgnored && anomalie.commentaire && (
        <p className="mb-0 italic text-xs text-mention-grey">
          {anomalie.commentaire}
        </p>
      )}
    </div>
  );
};

const renderStructureLabel = (anomalie: DashboardAnomalie): ReactNode => (
  <span className="grid grid-cols-[9rem_3.5rem_12rem_minmax(0,1fr)_4rem] items-center gap-x-3">
    <strong>{anomalie.structureCodeBhasile}</strong>
    <span>{anomalie.structureType}</span>
    <span className="truncate">{anomalie.operateurName}</span>
    <span className="truncate">
      {anomalie.structureCommune}
      {anomalie.structureDepartement && ` (${anomalie.structureDepartement})`}
    </span>
    <span>
      {anomalie.year === ANOMALIE_NO_YEAR ? "" : anomalie.year}
    </span>
  </span>
);

type Props = {
  anomalie: DashboardAnomalie;
  groupBy: AnomalieGroupBy;
  isSaving: boolean;
  onIgnore: (anomalie: DashboardAnomalie) => void;
  onReopen: (anomalie: DashboardAnomalie) => void;
};
