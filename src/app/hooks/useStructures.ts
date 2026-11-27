import { ApiError, extractApiError } from "../utils/api-error.util";

export const useStructures = (): UseStructureResult => {
  const updateStructure = async (structure: unknown): Promise<void> => {
    const id = (structure as { id?: number }).id;
    const response = await fetch(`/api/structures/${id}`, {
      method: "PUT",
      body: JSON.stringify(structure),
    });
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }
  };

  const updateActualisation = async (
    structureId: number,
    structure: unknown
  ): Promise<void> => {
    const response = await fetch(
      `/api/structures/${structureId}/actualisation`,
      {
        method: "PUT",
        body: JSON.stringify({ ...(structure as object), id: structureId }),
      }
    );
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }
  };

  return {
    updateStructure,
    updateActualisation,
  };
};

type UseStructureResult = {
  updateStructure: (values: unknown) => Promise<void>;
  updateActualisation: (structureId: number, values: unknown) => Promise<void>;
};
