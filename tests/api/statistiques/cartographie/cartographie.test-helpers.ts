import type { StatistiqueDbStructure } from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

export const testStructure = (
  id: number,
  departementAdministratif: string,
  type: StructureType = StructureType.CADA
): StatistiqueDbStructure => ({ id, type, departementAdministratif });
