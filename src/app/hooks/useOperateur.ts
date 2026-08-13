import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";

import { ApiError, extractApiError } from "../utils/apiError.util";

export const useOperateur = () => {
  const updateOperateur = async (
    data: Partial<OperateurUpdateFormValues>
  ): Promise<{ operateurId: number }> => {
    const response = await fetch(`/api/operateurs/${data.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }

    return response.json();
  };

  return {
    updateOperateur,
  };
};
