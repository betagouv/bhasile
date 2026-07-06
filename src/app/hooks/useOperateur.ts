import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";

import { ApiError, extractApiError } from "../utils/apiError.util";
import { refreshBestEffort } from "../utils/refresh.util";

export const useOperateur = () => {
  const updateOperateur = async (
    data: Partial<OperateurUpdateFormValues>,
    setOperateur: (operateur: OperateurApiRead) => void
  ): Promise<{ operateurId: number }> => {
    const response = await fetch(`/api/operateurs/${data.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }

    const result = await response.json();
    await refreshBestEffort(`/api/operateurs/${result.operateurId}`, setOperateur);
    return result;
  };

  return {
    updateOperateur,
  };
};
