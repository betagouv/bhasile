"use client";

import { useRef, useState } from "react";

import { useFileUpload } from "@/app/hooks/useFileUpload";
import { ApiError } from "@/app/utils/api-error.util";

export const useMessageAttachments = (): MessageAttachments => {
  const { uploadFile, deleteFile } = useFileUpload();
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const removedIdsRef = useRef(new Set<string>());

  const updateAttachment = (id: string, update: AttachmentState) => {
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === id ? { ...attachment, ...update } : attachment
      )
    );
  };

  const deleteOrphanFile = (key: string) => {
    deleteFile(key).catch(() => undefined);
  };

  const uploadAttachment = async (id: string, file: File) => {
    try {
      const { key } = await uploadFile(file);
      if (removedIdsRef.current.has(id)) {
        deleteOrphanFile(key);
        return;
      }
      updateAttachment(id, { status: "uploaded", key });
    } catch (error) {
      if (removedIdsRef.current.has(id)) {
        return;
      }
      updateAttachment(id, {
        status: "error",
        errorMessage:
          error instanceof ApiError
            ? error.message
            : "Le fichier n’a pas pu être envoyé.",
      });
    }
  };

  const addFiles = (files: File[]) => {
    const drafts: AttachmentDraft[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: "uploading",
    }));
    setAttachments((current) => [...current, ...drafts]);
    drafts.forEach((draft, index) => uploadAttachment(draft.id, files[index]));
  };

  const removeAttachment = (id: string) => {
    const attachment = attachments.find((draft) => draft.id === id);
    if (attachment?.status === "uploaded") {
      deleteOrphanFile(attachment.key);
    }
    removedIdsRef.current.add(id);
    setAttachments((current) => current.filter((draft) => draft.id !== id));
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  const fileKeys = attachments.flatMap((attachment) =>
    attachment.status === "uploaded" ? [attachment.key] : []
  );

  return {
    attachments,
    addFiles,
    removeAttachment,
    clearAttachments,
    fileKeys,
    isUploading: attachments.some(
      (attachment) => attachment.status === "uploading"
    ),
    hasUploadError: attachments.some(
      (attachment) => attachment.status === "error"
    ),
  };
};

type AttachmentState =
  | { status: "uploading" }
  | { status: "uploaded"; key: string }
  | { status: "error"; errorMessage: string };

export type AttachmentDraft = {
  id: string;
  name: string;
  size: number;
} & AttachmentState;

type MessageAttachments = {
  attachments: AttachmentDraft[];
  addFiles: (files: File[]) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  fileKeys: string[];
  isUploading: boolean;
  hasUploadError: boolean;
};
