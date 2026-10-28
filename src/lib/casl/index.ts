export {
  canAbilityReadCpom,
  canSaveCpom,
  getReadableCpomWhere,
  getUpdatableCpomWhere,
} from "./cpom.ability";
export { canDeleteFile } from "./file.ability";
export { canUpdateOperateur } from "./operateur.ability";
export { type AppAbility, canAccessApp, defineAbilityFor } from "./rules";
export {
  canAbilityReadStructure,
  canAbilityUpdateDepartement,
  canUpdateStructure,
  getReadableDepartementNumeros,
  getReadableStructureWhere,
} from "./structure.ability";
