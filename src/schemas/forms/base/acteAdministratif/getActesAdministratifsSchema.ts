import { getCpomCoveredActeCategories } from "@/app/utils/acteAdministratif.util";
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
