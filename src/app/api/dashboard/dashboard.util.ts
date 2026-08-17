import { canUpdateDepartement } from "@/lib/casl/abilities";
import { SessionUser } from "@/types/global";

type ScopedStructure = {
  departementAdministratif: string;
  operateur: { id: number } | null;
  type: string | null;
};

type ScopeFilters = {
  user: SessionUser | undefined;
  departementList: string[];
  operateurList: string[];
  typeList: string[];
};

export const isStructureInDashboardScope = (
  structure: ScopedStructure,
  { user, departementList, operateurList, typeList }: ScopeFilters
): boolean => {
  if (
    !user ||
    !canUpdateDepartement(user, structure.departementAdministratif)
  ) {
    return false;
  }

  if (
    departementList.length > 0 &&
    !departementList.includes(structure.departementAdministratif)
  ) {
    return false;
  }

  const operateurId = structure.operateur?.id ?? null;
  if (
    operateurList.length > 0 &&
    (operateurId === null || !operateurList.includes(String(operateurId)))
  ) {
    return false;
  }

  if (
    typeList.length > 0 &&
    (structure.type === null || !typeList.includes(structure.type))
  ) {
    return false;
  }

  return true;
};
