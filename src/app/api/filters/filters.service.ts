import { cache } from "react";

import { Filters } from "@/types/filters.type";
import {
  ParsedFilters,
  parseFilters,
} from "@/utils/filters.util";

import { findOperateurFiliales } from "../operateurs/operateur.repository";

const resolveFiltersCached = cache(
  async (
    departements: string | null,
    operateurs: string | null,
    types: string | null
  ): Promise<ParsedFilters> => {
    const filters = parseFilters({ departements, operateurs, types });
    const filiales = await findOperateurFiliales(
      filters.operateurList.map(Number)
    );
    return {
      ...filters,
      operateurList: [
        ...new Set([
          ...filters.operateurList,
          ...filiales.map((filiale) => String(filiale.id)),
        ]),
      ],
    };
  }
);

export const resolveFilters = ({
  departements,
  operateurs,
  types,
}: Partial<Filters>): Promise<ParsedFilters> =>
  resolveFiltersCached(
    departements ?? null,
    operateurs ?? null,
    types ?? null
  );
