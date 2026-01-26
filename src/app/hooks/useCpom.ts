import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";

export const useCpom = () => {
  const addCpom = async (
    data: CpomFormValues
  ): Promise<{ cpomId: number } | string> => {
    try {
      const response = await fetch("/api/cpoms", {
        method: "POST",
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

  const updateCpom = async (data: CpomFormValues): Promise<string> => {
    try {
      const response = await fetch(`/api/cpoms/${data.id}`, {
        method: "PUT",
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
