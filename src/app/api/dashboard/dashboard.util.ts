import { canUpdateStructure } from "@/lib/casl";
import { SessionUser } from "@/types/global";
import {
  matchesStructureGlobalFilters,
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
  matchesStructureGlobalFilters(
    {
      departement: structure.departementAdministratif,
      operateurId: structure.operateur?.id,
      type: structure.type,
    },
    filters
  );
