import {
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";

export const useTransformations = (): UseTransformationsResult => {
  const createTransformation = async (
    transformation: TransformationApiCreate
  ): Promise<string> => {
    try {
      const response = await fetch("/api/transformations", {
        method: "POST",
        body: JSON.stringify(transformation),
      });
      if (response.status < 400) {
        return "OK";
      } else {
        const result = await response.json();
        return JSON.stringify(result);
      }
    } catch (error) {
      console.error(error);
      return String(error);
    }
  };

  const updateTransformation = async (
    transformationId: number,
    transformation: unknown
  ): Promise<string> => {
    try {
      const response = await fetch(`/api/transformations/${transformationId}`, {
        method: "PUT",
        body: JSON.stringify(transformation),
      });
      if (response.status < 400) {
        return "OK";
      } else {
        const result = await response.json();
        return JSON.stringify(result);
      }
    } catch (error) {
      console.error(error);
      throw new Error(error?.toString());
    }
  };

  const updateAndRefreshTransformation = async (
    transformationId: number,
    transformation: TransformationApiUpdate,
    setTransformation: (transformation: TransformationApiRead) => void
  ): Promise<string> => {
    const result = await updateTransformation(transformationId, transformation);
    if (result === "OK") {
      const data = await fetch(`/api/transformations/${transformationId}`);
      const updatedTransformation = await data.json();
      setTransformation(updatedTransformation);
    }
    return result;
  };

  return {
    createTransformation,
    updateTransformation,
    updateAndRefreshTransformation,
  };
};

type UseTransformationsResult = {
  createTransformation: (
    transformation: TransformationApiCreate
  ) => Promise<string>;
  updateTransformation: (
    transformationId: number,
    transformation: TransformationApiUpdate
  ) => Promise<string>;
  updateAndRefreshTransformation: (
    transformationId: number,
    transformation: TransformationApiUpdate,
    setTransformation: (transformation: TransformationApiRead) => void
  ) => Promise<string>;
};
