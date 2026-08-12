"use client";

import { ReactElement, useState } from "react";

import { useJustification } from "@/app/hooks/useJustification";
import { cn } from "@/app/utils/classname.util";
import {
  AnomalieGroupBy,
  AnomalieGroupNode,
  DashboardAnomalie,
} from "@/types/dashboard.type";

import {
  AnomalieJustificationModal,
  anomalieJustificationModal,
} from "./AnomalieJustificationModal";
import { AnomaliesGroupNode } from "./AnomaliesGroupNode";

export const AnomaliesGroups = ({ nodes, groupBy }: Props): ReactElement => {
  const { isSaving, isRefreshing, saveJustification } = useJustification();
  const [selectedAnomalie, setSelectedAnomalie] =
    useState<DashboardAnomalie | null>(null);

  const handleIgnore = (anomalie: DashboardAnomalie): void => {
    setSelectedAnomalie(anomalie);
    anomalieJustificationModal.open();
  };

  return (
    <div className={cn(isRefreshing && "pointer-events-none opacity-50")}>
      {nodes.map((node) => (
        <AnomaliesGroupNode
          key={node.key}
          node={node}
          groupBy={groupBy}
          isSaving={isSaving}
          onIgnore={handleIgnore}
          onReopen={(anomalie) => saveJustification(anomalie.id, false, null)}
        />
      ))}

      <AnomalieJustificationModal
        anomalie={selectedAnomalie}
        isSaving={isSaving}
        onSubmit={(anomalie, commentaire) =>
          saveJustification(anomalie.id, true, commentaire)
        }
      />
    </div>
  );
};

type Props = {
  nodes: AnomalieGroupNode[];
  groupBy: AnomalieGroupBy;
};
