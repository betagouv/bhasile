import { useCallback } from "react";

import { ApiError, extractApiError } from "../utils/apiError.util";

export type FileUploadResponse = {
  key: string;
  mimeType: string;
  originalName: string;
  id: number;
  fileSize: number;
};

export type FileUploadWithLink = FileUploadResponse & {
  fileUrl: string;
};

export const useFileUpload = () => {
  const uploadFile = async (file: File): Promise<FileUploadWithLink> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/files", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }
    const result = await response.json();
    return {
      ...result,
      fileUrl: await getDownloadLink(result.key),
    };
  };

  const getDownloadLink = useCallback(async (key: string): Promise<string> => {
    const encodedKey = encodeURIComponent(key);
    const response = await fetch(`/api/files/${encodedKey}?getLink=true`);
    const result = await response.json();
    return result.url;
  }, []);

  const getFile = useCallback(
    async (key: string): Promise<FileUploadWithLink> => {
      const encodedKey = encodeURIComponent(key);
      const response = await fetch(`/api/files/${encodedKey}`);
      const result = await response.json();
      return {
        ...result,
        fileUrl: await getDownloadLink(result.key),
      };
    },
    [getDownloadLink]
  );

  const deleteFile = useCallback(async (key: string): Promise<void> => {
    const encodedKey = encodeURIComponent(key);
    const response = await fetch(`/api/files/${encodedKey}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }

    return await response.json();
  }, []);

  return { uploadFile, getFile, deleteFile, getDownloadLink };
};
