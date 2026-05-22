import { useFetchState } from "@/app/context/FetchStateContext";
import { CpomApiRead } from "@/schemas/api/cpom.schema";
import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

const createOrUpdateCpom = async (
  url: string,
  method: "POST" | "PUT",
  data: Partial<CpomFormValues>
): Promise<number> => {
  const response = await fetch(url, {
    method,
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(body));
  }
  if (typeof body.cpomId !== "number") {
    throw new Error("Réponse invalide : cpomId manquant");
  }
  return body.cpomId;
};

export const useCpom = () => {
  const { setFetchState } = useFetchState();

  const addCpom = async (data: CpomFormValues): Promise<number> => {
    setFetchState("cpom-save", FetchState.LOADING);
    try {
      const cpomId = await createOrUpdateCpom("/api/cpoms", "POST", data);
      setFetchState("cpom-save", FetchState.IDLE);
      return cpomId;
    } catch (error) {
      setFetchState("cpom-save", FetchState.ERROR);
      throw error;
    }
  };

  const updateCpom = async (
    id: number,
    data: Partial<CpomFormValues>,
    setCpom: (cpom: CpomApiRead) => void
  ): Promise<number> => {
    setFetchState("cpom-save", FetchState.LOADING);
    try {
      const cpomId = await createOrUpdateCpom(`/api/cpoms/${id}`, "PUT", data);
      const res = await fetch(`/api/cpoms/${cpomId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch cpom: ${res.status}`);
      }
      setCpom(await res.json());
      setFetchState("cpom-save", FetchState.IDLE);
      return cpomId;
    } catch (error) {
      setFetchState("cpom-save", FetchState.ERROR);
      throw error;
    }
  };

  return { addCpom, updateCpom };
};
