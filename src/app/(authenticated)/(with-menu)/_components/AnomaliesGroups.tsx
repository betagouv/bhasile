"use client";

import { useRouter } from "next/navigation";
import { ReactElement, useState, useTransition } from "react";

import { cn } from "@/app/utils/classname.util";
import { useFetchState } from "@/contexts/FetchStateContext";
import {
  AnomalieGroupBy,
  AnomalieGroupNode,
  DashboardAnomalie,
} from "@/types/dashboard.type";
import { FetchState } from "@/types/fetch-state.type";

import {
  AnomalieJustificationModal,
  anomalieJustificationModal,
} from "./AnomalieJustificationModal";
import { AnomaliesGroupNode } from "./AnomaliesGroupNode";

const JUSTIFICATION_FETCH_KEY = "anomalie-justification-save";

export const AnomaliesGroups = ({ nodes, groupBy }: Props): ReactElement => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { setFetchState } = useFetchState();
  const [selectedAnomalie, setSelectedAnomalie] =
    useState<DashboardAnomalie | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveJustification = async (
    anomalie: DashboardAnomalie,
    isJustified: boolean,
    commentaire: string | null
  ): Promise<boolean> => {
    if (isSaving) {
      return false;
    }
    setIsSaving(true);
    setFetchState(JUSTIFICATION_FETCH_KEY, FetchState.LOADING);
    try {
      const response = await fetch(`/api/anomalies/${anomalie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isJustified, commentaire }),
      });

      // 404 : l'anomalie a disparu depuis le rendu, le rafraîchissement la retirera de l'écran.
      if (!response.ok && response.status !== 404) {
        throw new Error(await response.text());
      }

      setFetchState(JUSTIFICATION_FETCH_KEY, FetchState.IDLE);
      startTransition(() => router.refresh());
      return true;
    } catch (error) {
      setFetchState(
        JUSTIFICATION_FETCH_KEY,
        FetchState.ERROR,
        error instanceof Error ? error.message : String(error)
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleIgnore = (anomalie: DashboardAnomalie): void => {
    setSelectedAnomalie(anomalie);
    anomalieJustificationModal.open();
  };

  return (
    <div className={cn(isPending && "pointer-events-none opacity-50")}>
      {nodes.map((node) => (
        <AnomaliesGroupNode
          key={node.key}
          node={node}
          groupBy={groupBy}
          isSaving={isSaving}
          onIgnore={handleIgnore}
          onReopen={(anomalie) => saveJustification(anomalie, false, null)}
        />
      ))}

      <AnomalieJustificationModal
        anomalie={selectedAnomalie}
        isSaving={isSaving}
        onSubmit={(anomalie, commentaire) =>
          saveJustification(anomalie, true, commentaire)
        }
      />
    </div>
  );
};

type Props = {
  nodes: AnomalieGroupNode[];
  groupBy: AnomalieGroupBy;
};
