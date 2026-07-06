import { CpomApiRead } from "@/schemas/api/cpom.schema";
import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";

import { ApiError, extractApiError } from "../utils/apiError.util";
import { refreshBestEffort } from "../utils/refresh.util";

const createOrUpdateCpom = async (
  url: string,
  method: "POST" | "PUT",
  data: Partial<CpomFormValues>
): Promise<number> => {
  const response = await fetch(url, {
    method,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
  const body = await response.json();
  if (typeof body.cpomId !== "number") {
    throw new Error("Réponse invalide : cpomId manquant");
  }
  return body.cpomId;
};

export const useCpom = () => {
  const addCpom = async (data: CpomFormValues): Promise<number> => {
    return createOrUpdateCpom("/api/cpoms", "POST", data);
  };

  const updateCpom = async (
    id: number,
    data: Partial<CpomFormValues>,
    setCpom: (cpom: CpomApiRead) => void
  ): Promise<number> => {
    const cpomId = await createOrUpdateCpom(`/api/cpoms/${id}`, "PUT", data);
    await refreshBestEffort(`/api/cpoms/${cpomId}`, setCpom);
    return cpomId;
  };

  return { addCpom, updateCpom };
};
