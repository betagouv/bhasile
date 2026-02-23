import { CpomFormType } from "@/schemas/forms/base/cpom.schema";
import { Cpom } from "@/types/cpom.type";

export const useCpom = () => {
  const addCpom = async (
    data: CpomFormType
  ): Promise<{ cpomId: number } | string> => {
    return createOrUpdateCpom(data, "POST");
  };

  const updateCpom = async (
    data: CpomFormType,
    setCpom: (cpom: Cpom) => void
  ): Promise<{ cpomId: number } | string> => {
    const result = await createOrUpdateCpom(data, "PUT");
    if (typeof result === "object" && "cpomId" in result) {
      const res = await fetch(`/api/cpoms/${result.cpomId}`);
      if (res.ok) {
        const updatedCpom = await res.json();
        setCpom(updatedCpom);
      }
    }
    return result;
  };

  const createOrUpdateCpom = async (
    data: CpomFormType,
    method: "POST" | "PUT"
  ): Promise<{ cpomId: number } | string> => {
    try {
      const response = await fetch(`/api/cpoms`, {
        method,
        body: JSON.stringify(data),
      });
      if (response.status < 400) {
        return response.json();
      } else {
        const result = await response.json();
        return JSON.stringify(result);
      }
    } catch (error) {
      console.error(error);
      return String(error);
    }
  };

  return {
    addCpom,
    updateCpom,
  };
};
