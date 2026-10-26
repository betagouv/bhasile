import { cache } from "react";

import { Filters } from "@/types/filters.type";
import {
  ParsedGlobalFilters,
  parseGlobalFilters,
} from "@/utils/global-filters.util";

import { findOperateurFiliales } from "../operateurs/operateur.repository";

const resolveGlobalFiltersCached = cache(
  async (
    departements: string | null,
    operateurs: string | null,
    types: string | null
  ): Promise<ParsedGlobalFilters> => {
    const filters = parseGlobalFilters({ departements, operateurs, types });
    const filiales = await findOperateurFiliales(
      filters.operateurList.map(Number)
    );
    return {
      ...filters,
      operateurList: [
        ...filters.operateurList,
        ...filiales.map((filiale) => String(filiale.id)),
      ],
    };
  }
);

export const resolveGlobalFilters = ({
  departements,
  operateurs,
  types,
}: Partial<Filters>): Promise<ParsedGlobalFilters> =>
  resolveGlobalFiltersCached(
    departements ?? null,
    operateurs ?? null,
    types ?? null
  );
