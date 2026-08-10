"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ApiError, extractApiError } from "@/app/utils/apiError.util";
import { useFetchState } from "@/contexts/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

const JUSTIFICATION_FETCH_KEY = "anomalie-justification-save";

export const useJustification = (): {
  isSaving: boolean;
  isRefreshing: boolean;
  saveJustification: (
    anomalieId: number,
    isJustified: boolean,
    commentaire: string | null
  ) => Promise<boolean>;
} => {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const { setFetchState } = useFetchState();
  const [isSaving, setIsSaving] = useState(false);

  const saveJustification = async (
    anomalieId: number,
    isJustified: boolean,
    commentaire: string | null
  ): Promise<boolean> => {
    if (isSaving) {
      return false;
    }
    setIsSaving(true);
    setFetchState(JUSTIFICATION_FETCH_KEY, FetchState.LOADING);

    try {
      const response = await fetch(`/api/anomalies/${anomalieId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isJustified, commentaire }),
      });

      if (!response.ok && response.status !== 404) {
        throw new ApiError(await extractApiError(response), response.status);
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

  return { isSaving, isRefreshing, saveJustification };
};
