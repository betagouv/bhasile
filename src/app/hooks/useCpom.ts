import { CpomApiType } from "@/schemas/api/cpom.schema";
import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";

export const useCpom = () => {
  const addCpom = async (
    data: CpomFormValues
  ): Promise<{ cpomId: number } | string> => {
    return createOrUpdateCpom(data, "PUT");
  };

  const updateCpom = async (
    data: CpomFormValues,
    setCpom: (cpom: CpomApiType) => void
  ): Promise<{ cpomId: number } | string> => {
    const result = await createOrUpdateCpom(data, "PUT");
    if (typeof result === "object" && "cpomId" in result) {
      const res = await fetch(`/api/cpoms/${result.cpomId}`);
      const updatedCpom = await res.json();
      setCpom(updatedCpom);
    }
    return result;
  };

  const createOrUpdateCpom = async (
    data: CpomFormValues,
    method: "POST" | "PUT"
  ): Promise<{ cpomId: number } | string> => {
    try {
      const response = await fetch(`/api/cpodzqdzqms`, {
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
