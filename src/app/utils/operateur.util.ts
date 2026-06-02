import { operateurActesAdministratifsCategoryToDisplay } from "@/config/operateur.config";
import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";

import { getActesAdministratifsDefaultValues } from "./acteAdministratif.util";

type OperateurDefaultValues = Omit<
  OperateurUpdateFormValues,
  "actesAdministratifs"
> & {
  actesAdministratifs: ActeAdministratifFormValues[];
};

export const getOperateurDefaultValues = (
  operateur?: OperateurApiRead
): OperateurDefaultValues => {
  return {
    ...operateur,
    name: operateur?.name,
    directionGenerale: operateur?.directionGenerale,
    siret: operateur?.siret,
    siegeSocial: operateur?.siegeSocial,
    vulnerabilites: operateur?.vulnerabilites || [],
    actesAdministratifs: getActesAdministratifsDefaultValues(
      operateur?.actesAdministratifs,
      operateurActesAdministratifsCategoryToDisplay
    ),
  };
};
