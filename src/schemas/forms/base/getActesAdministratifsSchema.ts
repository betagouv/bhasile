import { getCpomCoveredActeCategories } from "@/app/utils/acteAdministratif.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";

import {
  getActesAdministratifsAutoriseesSchema,
  getActesAdministratifsSubventionneesSchema,
} from "./acteAdministratif.schema";

// Le caractère obligatoire d'un acte dépend de la structure : les catégories
// déjà portées par un de ses CPOM ne lui sont plus exigées.
export const getActesAdministratifsSchema = (structure: StructureApiRead) => {
  const coveredCategories = getCpomCoveredActeCategories(structure);

  return structure.isAutorisee
    ? getActesAdministratifsAutoriseesSchema(coveredCategories)
    : getActesAdministratifsSubventionneesSchema(coveredCategories);
};
