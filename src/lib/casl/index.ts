export {
  canAbilityReadCpom,
  canAbilityUpdateCpom,
  canSaveCpom,
  getReadableCpomWhere,
} from "./cpom.ability";
export { canDeleteFile } from "./file.ability";
export { canUpdateOperateur } from "./operateur.ability";
export { type AppAbility, canAccessApp, defineAbilityFor } from "./rules";
export {
  canAbilityReadStructure,
  canAbilityUpdateDepartement,
  canUpdateDepartement,
  canUpdateStructure,
  getReadableDepartementNumeros,
  getReadableStructureWhere,
} from "./structure.ability";
