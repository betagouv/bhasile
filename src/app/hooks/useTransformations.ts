import {
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";

const createOrUpdateTransformation = async (
  url: string,
  method: "POST" | "PUT",
  transformation: TransformationApiCreate | TransformationApiUpdate
): Promise<number> => {
  const response = await fetch(url, {
    method,
    body: JSON.stringify(transformation),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(body));
  }
  if (typeof body.transformationId !== "number") {
    throw new Error("Réponse invalide : transformationId manquant");
  }
  return body.transformationId;
};

export const useTransformations = () => {
  const createTransformation = (transformation: TransformationApiCreate) =>
    createOrUpdateTransformation(
      "/api/transformations",
      "POST",
      transformation
    );

  const updateTransformation = async (
    id: number,
    transformation: TransformationApiUpdate,
    setTransformation: (transformation: TransformationApiRead) => void
  ): Promise<number> => {
    const transformationId = await createOrUpdateTransformation(
      `/api/transformations/${id}`,
      "PUT",
      transformation
    );
    const res = await fetch(`/api/transformations/${transformationId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch transformation: ${res.status}`);
    }
    setTransformation(await res.json());
    return transformationId;
  };

  return {
    createTransformation,
    updateTransformation,
  };
};
