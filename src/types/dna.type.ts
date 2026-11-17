import { StructureType } from "@/types/structure.type";

export type FreeDnaCode = {
  code: string;
  departementAdministratif: string;
};

export type FreeDnaCodeFilters = {
  operateurId?: number;
  departementAdministratif?: string;
  type?: StructureType;
};
