import {
  StructureVersionTransformationApiCreate,
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdateClient,
} from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

import { ApiError, extractApiError } from "../utils/apiError.util";
import { refreshBestEffort } from "../utils/refresh.util";

const createOrUpdateTransformation = async (
  url: string,
  method: "POST" | "PUT",
  transformation: TransformationApiCreate | TransformationApiUpdateClient
): Promise<number> => {
  const response = await fetch(url, {
    method,
    body: JSON.stringify(transformation),
  });
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
  const body = await response.json();
  if (typeof body.transformationId !== "number") {
    throw new Error("Réponse invalide : transformationId manquant");
  }
  return body.transformationId;
};

export const useTransformations = () => {
  const createTransformation = async (
    transformation: TransformationApiCreate
  ): Promise<number> => {
    return createOrUpdateTransformation(
      "/api/transformations",
      "POST",
      transformation
    );
  };

  const updateTransformation = async (
    id: number,
    transformation: TransformationApiUpdateClient,
    setTransformation: (transformation: TransformationApiRead) => void
  ): Promise<number> => {
    const transformationId = await createOrUpdateTransformation(
      `/api/transformations/${id}`,
      "PUT",
      transformation
    );
    await refreshBestEffort(
      `/api/transformations/${transformationId}`,
      setTransformation
    );
    return transformationId;
  };

  const resetTransformationSelection = async (
    id: number,
    input: {
      type: TransformationType;
      structureVersionTransformations: StructureVersionTransformationApiCreate[];
    },
    setTransformation: (transformation: TransformationApiRead) => void
  ): Promise<TransformationApiRead> => {
    const response = await fetch(`/api/transformations/${id}/selection`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }
    const refreshed = await fetch(`/api/transformations/${id}`);
    if (!refreshed.ok) {
      throw new ApiError(await extractApiError(refreshed), refreshed.status);
    }
    const transformation = await refreshed.json();
    setTransformation(transformation);
    return transformation;
  };

  const deleteTransformation = async (id: number): Promise<void> => {
    const response = await fetch(`/api/transformations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }
  };

  return {
    createTransformation,
    updateTransformation,
    resetTransformationSelection,
    deleteTransformation,
  };
};
