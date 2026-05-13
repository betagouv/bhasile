import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";

export const useOperateur = () => {
  const updateOperateur = async (
    data: Partial<OperateurUpdateFormValues>,
    setOperateur: (operateur: OperateurApiRead) => void
  ): Promise<{ operateurId: number } | string> => {
    try {
      let result;
      const response = await fetch(`/api/operateurs/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (response.status < 400) {
        result = await response.json();
      } else {
        const operateur = await response.json();
        result = JSON.stringify(operateur);
      }

      if (
        typeof result === "object" &&
        "operateurId" in result &&
        result !== null
      ) {
        const res = await fetch(`/api/operateurs/${result.operateurId}`);
        if (res.ok) {
          const updatedOperateur = await res.json();
          setOperateur(updatedOperateur);
        }
      }
      return result;
    } catch (error) {
      console.error(error);
      return String(error);
    }
  };

  return {
    updateOperateur,
  };
};
