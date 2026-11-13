"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback } from "react";

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

  const postWithUploadedFile = async (
    file: File,
    send: (fileKey: string) => Promise<{ id: number }>
  ): Promise<{ id: number }> => {
    const { key } = await uploadFile(file);
    try {
      return await send(key);
    } catch (error) {
      deleteFile(key).catch(() => undefined);
      throw error;
    }
  };

  const refresh = () => startTransition(() => router.refresh());

  const depositDocument = async ({
    file,
    type,
    status,
  }: {
    file: File;
    type: TarificationDocumentType;
    status: TarificationDocumentStatus;
  }): Promise<void> => {
    await postWithUploadedFile(file, (fileKey) =>
      post("documents", { fileKey, types: [type], status })
    );
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
    await (file
      ? postWithUploadedFile(file, (fileKey) =>
          post("events", { type, text, fileKey })
        )
      : post("events", { type, text }));
    refresh();
  };

  return { depositDocument, recordEvent, respondToL48 };
};
