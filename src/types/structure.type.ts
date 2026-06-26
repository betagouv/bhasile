export enum PublicType {
  TOUT_PUBLIC = "Tout public",
  FAMILLE = "Famille",
  PERSONNES_ISOLEES = "Personnes isolées",
}

export enum StructureType {
  CADA = "CADA",
  HUDA = "HUDA",
  CPH = "CPH",
  CAES = "CAES",
  PRAHDA = "PRAHDA",
}

export const STRUCTURE_TYPES_DISPLAY_ORDER: StructureType[] = [
  StructureType.CADA,
  StructureType.CAES,
  StructureType.CPH,
  StructureType.HUDA,
  StructureType.PRAHDA,
];
