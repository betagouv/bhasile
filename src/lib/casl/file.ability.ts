import type { FileWithParents } from "@/app/api/files/file.db.type";
import { SessionUser } from "@/types/global";

import { canAbilityUpdateCpom } from "./cpom.ability";
import { canAbilityUpdateOperateur } from "./operateur.ability";
import { defineAbilityFor } from "./rules";
import { canUpdateStructure } from "./structure.ability";

export const canDeleteFile = (
  user: SessionUser,
  file: FileWithParents
): boolean => {
  const ability = defineAbilityFor(user);

  if (file.acteAdministratifId) {
    const acte = file.acteAdministratif;
    if (!acte) {
      return false;
    }
    if (acte.structureVersionTransformationId) {
      return true;
    }
    if (acte.structureId) {
      return canUpdateStructure(user, acte.structure);
    }
    if (acte.cpom) {
      return canAbilityUpdateCpom(ability, acte.cpom);
    }
    if (acte.operateur) {
      return canAbilityUpdateOperateur(ability, acte.operateur.id);
    }
    return false;
  }

  if (file.documentFinancierId) {
    return canUpdateStructure(user, file.documentFinancier?.structure);
  }
  if (file.controleId) {
    return canUpdateStructure(user, file.controle?.structure);
  }
  if (file.evaluationId) {
    return canUpdateStructure(user, file.evaluation?.structure);
  }
  if (file.operateur) {
    return canAbilityUpdateOperateur(ability, file.operateur.id);
  }

  return false;
};
