"use client";

import { formatPlural } from "@/app/utils/string.util";
import { buildZoneSummary } from "@/app/utils/zone.util";
import { ACCEPTED_STRUCTURE_TYPES } from "@/types/structure.type";
import { filterRegionsWithDepartements } from "@/utils/region.util";
import { buildTypesSummary } from "@/utils/structure-type.util";

import { FilterDropdown } from "./FilterDropdown";
import { FilterOperateur } from "./FilterOperateur";
import { FiltersDepartement } from "./FiltersDepartement";
import { FilterTypeStructure } from "./FilterTypeStructure";

export const HeaderFilters = () => {
  return (
    <div className="flex">
      <FilterDropdown
        label="Zone"
        placeholder="Toute la France"
        filterId="departements"
        getSummaryLabel={buildZoneSummary}
        renderOptions={({ getCheckedValues, setCheckedValues }) => (
          <FiltersDepartement
            departements={getCheckedValues(ALL_DEPARTEMENTS)}
            onChange={(departements) =>
              setCheckedValues(departements, ALL_DEPARTEMENTS)
            }
          />
        )}
      />

      <FilterDropdown
        label="Opérateurs"
        placeholder="Tous les opérateurs"
        filterId="operateurs"
        getSummaryLabel={(operateurIds) =>
          formatPlural(operateurIds.length, "opérateur")
        }
        renderOptions={(filterSelection) => (
          <FilterOperateur filterSelection={filterSelection} />
        )}
      />

      <FilterDropdown
        label="Types structure"
        placeholder="Tous les types"
        filterId="types"
        getSummaryLabel={buildTypesSummary}
        renderOptions={({ getCheckedValues, setCheckedValues }) => (
          <FilterTypeStructure
            selection={getCheckedValues(ACCEPTED_STRUCTURE_TYPES)}
            onChange={(types) =>
              setCheckedValues(types, ACCEPTED_STRUCTURE_TYPES)
            }
          />
        )}
      />
    </div>
  );
};

const ALL_DEPARTEMENTS = filterRegionsWithDepartements("").flatMap(
  ({ departements }) => departements.map(({ numero }) => numero)
);
