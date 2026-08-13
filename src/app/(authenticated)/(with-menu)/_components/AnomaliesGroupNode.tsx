"use client";

import { ReactElement, ReactNode, useState } from "react";

import {
  AnomalieGroupBy,
  AnomalieGroupNode,
  DashboardAnomalie,
} from "@/types/dashboard.type";

import { AnomalieRow } from "./AnomalieRow";

export const AnomaliesGroupNode = ({
  node,
  groupBy,
  isSaving,
  onIgnore,
  onReopen,
}: Props): ReactElement | null => {
  const [isOpen, setIsOpen] = useState(false);
  const [firstAnomalie] = node.anomalies;

  if (!firstAnomalie) {
    return null;
  }

  return (
    <div className="border-b border-default-grey [&:last-child]:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-3 px-6 text-left text-sm"
      >
        <span className="min-w-0">
          {renderHeaderLabel(firstAnomalie, groupBy)}
        </span>
        <span className="flex items-center gap-4">
          <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-contrast-grey text-xs">
            {node.activeCount}
          </span>
          <span
            className={
              isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"
            }
          />
        </span>
      </button>

      {isOpen && (
        <div className="border-l-2 border-active-blue-france mb-4 ml-6 pl-6">
          {node.anomalies.map((anomalie) => (
            <AnomalieRow
              key={anomalie.id}
              anomalie={anomalie}
              groupBy={groupBy}
              isSaving={isSaving}
              onIgnore={onIgnore}
              onReopen={onReopen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const renderHeaderLabel = (
  anomalie: DashboardAnomalie,
  groupBy: AnomalieGroupBy
): ReactNode => {
  if (groupBy === "CODE") {
    return <strong>{anomalie.label}</strong>;
  }

  return (
    <span className="grid grid-cols-[9rem_3.5rem_12rem_minmax(0,1fr)] items-center gap-x-3">
      <strong>{anomalie.structureCodeBhasile}</strong>
      <span>{anomalie.structureType}</span>
      <span className="truncate">{anomalie.operateurName}</span>
      <span className="truncate">
        {anomalie.structureCommune}
        {anomalie.structureDepartement && ` (${anomalie.structureDepartement})`}
      </span>
    </span>
  );
};

type Props = {
  node: AnomalieGroupNode;
  groupBy: AnomalieGroupBy;
  isSaving: boolean;
  onIgnore: (anomalie: DashboardAnomalie) => void;
  onReopen: (anomalie: DashboardAnomalie) => void;
};
