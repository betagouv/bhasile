"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback, useRef } from "react";

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
  const depositedResponseRef = useRef<{ file: File; id: number } | null>(null);
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

  // Le journal est en ajout seul : réessayer après un échec ne doit pas déposer le fichier une seconde fois
  const depositResponseDocument = async (file: File): Promise<number> => {
    if (depositedResponseRef.current?.file === file) {
      return depositedResponseRef.current.id;
    }
    const { id } = await postDocument({
      file,
      type: "REPONSE_CONTRADICTOIRE",
      status: "SHARED",
    });
    depositedResponseRef.current = { file, id };
    refresh();
    return id;
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
    const documentId = file ? await depositResponseDocument(file) : null;
    await post("events", { type, text, documentId });
    depositedResponseRef.current = null;
    refresh();
  };

  return { depositDocument, recordEvent, respondToL48 };
};
