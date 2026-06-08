import { useFetchState } from "@/app/context/FetchStateContext";
import {
  TransformationApiCreate,
  TransformationApiRead,
  TransformationApiUpdateClient,
} from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";

const createOrUpdateTransformation = async (
  url: string,
  method: "POST" | "PUT",
  transformation: TransformationApiCreate | TransformationApiUpdateClient
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
  const { setFetchState } = useFetchState();

  const createTransformation = async (
    transformation: TransformationApiCreate
  ): Promise<number> => {
    setFetchState("transformation-save", FetchState.LOADING);
    try {
      const transformationId = await createOrUpdateTransformation(
        "/api/transformations",
        "POST",
        transformation
      );
      setFetchState("transformation-save", FetchState.IDLE);
      return transformationId;
    } catch (error) {
      setFetchState("transformation-save", FetchState.ERROR);
      throw error;
    }
  };

  const updateTransformation = async (
    id: number,
    transformation: TransformationApiUpdateClient,
    setTransformation: (transformation: TransformationApiRead) => void
  ): Promise<number> => {
    setFetchState("transformation-save", FetchState.LOADING);
    try {
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
      setFetchState("transformation-save", FetchState.IDLE);
      return transformationId;
    } catch (error) {
      setFetchState("transformation-save", FetchState.ERROR);
      throw error;
    }
  };

  const deleteTransformation = async (id: number): Promise<void> => {
    setFetchState("transformation-delete", FetchState.LOADING);
    try {
      const response = await fetch(`/api/transformations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error ?? `Erreur lors de la suppression : ${response.status}`
        );
      }
      setFetchState("transformation-delete", FetchState.IDLE);
    } catch (error) {
      setFetchState("transformation-delete", FetchState.ERROR);
      throw error;
    }
  };

  return {
    createTransformation,
    updateTransformation,
    deleteTransformation,
  };
};
