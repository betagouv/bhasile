"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

import { useFileUpload } from "@/app/hooks/useFileUpload";
import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import type {
  TarificationDocumentStatus,
  TarificationDocumentType,
} from "@/generated/prisma/enums";
import type { TarificationEventApiCreateClient } from "@/schemas/api/tarification.schema";

export const useTarificationActions = ({
  structureId,
  year,
}: {
  structureId: number;
  year: number;
}) => {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const { uploadFile, deleteFile } = useFileUpload();

  const post = useCallback(
    async (path: string, body: unknown): Promise<{ id: number }> => {
      const response = await fetch(
        `/api/tarifications/${structureId}/${year}/${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        throw new ApiError(await extractApiError(response), response.status);
      }
      return response.json();
    },
    [structureId, year]
  );

  const postDocument = async ({
    file,
    type,
    status,
  }: {
    file: File;
    type: TarificationDocumentType;
    status: TarificationDocumentStatus;
  }): Promise<{ id: number }> => {
    const { key } = await uploadFile(file);
    try {
      return await post("documents", { fileKey: key, types: [type], status });
    } catch (error) {
      deleteFile(key).catch(() => undefined);
      throw error;
    }
  };

  const refresh = () => startTransition(() => router.refresh());

  const depositDocument = async (
    document: Parameters<typeof postDocument>[0]
  ): Promise<void> => {
    await postDocument(document);
    refresh();
  };

  const recordEvent = async (
    event: TarificationEventApiCreateClient
  ): Promise<void> => {
    await post("events", event);
    refresh();
  };

  const respondToL48 = async ({
    type,
    text,
    file,
  }: {
    type: "L48_ACCEPTED" | "L48_CONTESTED";
    text: string;
    file: File | null;
  }): Promise<void> => {
    const document = file
      ? await postDocument({
          file,
          type: "REPONSE_CONTRADICTOIRE",
          status: "SHARED",
        })
      : null;
    await post("events", { type, text, documentId: document?.id ?? null });
    refresh();
  };

  return { depositDocument, recordEvent, respondToL48, isRefreshing };
};
