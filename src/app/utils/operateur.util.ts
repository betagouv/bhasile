import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";

export const getOperateurDefaultValues = (
  operateur?: OperateurApiRead
): OperateurUpdateFormValues => {
  return {
    ...operateur,
    name: operateur?.name,
    directionGenerale: operateur?.directionGenerale,
    siret: operateur?.siret,
    siegeSocial: operateur?.siegeSocial,
    vulnerabilites: operateur?.vulnerabilites || [],
  };
};
