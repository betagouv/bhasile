import { canUpdateStructure } from "@/lib/casl";
import { SessionUser } from "@/types/global";
import {
  matchesGlobalFilters,
  ParsedGlobalFilters,
} from "@/utils/global-filters.util";

type ScopedStructure = {
  id: number;
  departementAdministratif: string;
  operateur: { id: number } | null;
  type: string | null;
};

type ScopeFilters = ParsedGlobalFilters & {
  user: SessionUser | undefined;
};

export const isStructureInDashboardScope = (
  structure: ScopedStructure,
  { user, ...filters }: ScopeFilters
): boolean =>
  !!user &&
  canUpdateStructure(user, structure) &&
  matchesGlobalFilters(
    {
      departements: [structure.departementAdministratif],
      operateurIds: [structure.operateur?.id],
      types: [structure.type],
    },
    filters
  );
