import { getCpomCoveredActeCategories } from "@/app/utils/acte-administratif.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";

import {
  getActesAdministratifsAutoriseesSchema,
  getActesAdministratifsSubventionneesSchema,
} from "../acteAdministratif.schema";

export const getActesAdministratifsSchema = (structure: StructureApiRead) => {
  const coveredCategories = getCpomCoveredActeCategories(structure);

  return structure.isAutorisee
    ? getActesAdministratifsAutoriseesSchema(coveredCategories)
    : getActesAdministratifsSubventionneesSchema(coveredCategories);
};
