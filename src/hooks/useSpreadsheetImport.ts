import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import { ImportPreview, ImportResult } from "@/types/import.type";

const sendSpreadsheet = async <T>(url: string, file: File): Promise<T> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(url, { method: "POST", body: formData });
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
  return response.json();
};

export const useSpreadsheetImport = (endpoint: string) => {
  const previewImport = (file: File): Promise<ImportPreview> =>
    sendSpreadsheet(`${endpoint}/preview`, file);

  const applyImport = (file: File): Promise<ImportResult> =>
    sendSpreadsheet(endpoint, file);

  return { previewImport, applyImport };
};
