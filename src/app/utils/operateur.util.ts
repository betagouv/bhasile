import { v4 as uuidv4 } from "uuid";

import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export const getOperateurDefaultValues = (
  operateur?: OperateurApiRead
): OperateurUpdateFormValues => {
  return {
    ...operateur,
    name: operateur?.name,
    directionGenerale: operateur?.directionGenerale,
    siret: operateur?.siret,
    siegeSocial: operateur?.siegeSocial,
    actesAdministratifs: operateur?.actesAdministratifs?.length
      ? operateur?.actesAdministratifs
      : [
          {
            uuid: uuidv4(),
            category: "" as ActeAdministratifCategory,
          },
        ],
    documentsFinanciers:
      operateur?.documentsFinanciers.map((documentFinancier) => ({
        ...documentFinancier,
        uuid: uuidv4(),
      })) || [],
  };
};
