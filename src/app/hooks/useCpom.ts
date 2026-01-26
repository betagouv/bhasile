import { CpomAjoutIdentificationFormValues } from "@/schemas/forms/cpom/cpomAjoutIdentification.schema";

export const useCpom = () => {
  const addCpom = async (
    data: CpomAjoutIdentificationFormValues
  ): Promise<string> => {
    try {
      const response = await fetch("/api/cpom", {
        method: "POST",
        body: JSON.stringify(data),
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

  return {
    addCpom,
  };
};
