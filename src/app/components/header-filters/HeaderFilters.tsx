import { FiltersDepartement } from "@/app/components/filters/FiltersDepartement";
import { formatPlural } from "@/app/utils/string.util";
import { buildZoneSummary } from "@/app/utils/zone.util";
import { buildTypesSummary } from "@/utils/structureType.util";

import { FilterDropdown } from "./FilterDropdown";
import { FilterOperateur } from "./FilterOperateur";
import { FilterTypeStructure } from "./FilterTypeStructure";

export const HeaderFilters = () => {
  return (
    <div className="flex">
      <FilterDropdown
        label="Zone"
        placeholder="Toute la France"
        filterId="departements"
        getSummaryLabel={buildZoneSummary}
      >
        {({ selection, setSelection }) => (
          <FiltersDepartement
            departements={selection}
            onChange={setSelection}
          />
        )}
      </FilterDropdown>

      <FilterDropdown
        label="Opérateurs"
        placeholder="Tous les opérateurs"
        filterId="operateurs"
        getSummaryLabel={(operateurIds) =>
          formatPlural(operateurIds.length, "opérateur")
        }
      >
        {({ selection, toggleValue }) => (
          <FilterOperateur selection={selection} onToggle={toggleValue} />
        )}
      </FilterDropdown>

      <FilterDropdown
        label="Types Structure"
        placeholder="Tous les types"
        filterId="types"
        getSummaryLabel={buildTypesSummary}
      >
        {({ selection, setSelection }) => (
          <FilterTypeStructure selection={selection} onChange={setSelection} />
        )}
      </FilterDropdown>
    </div>
  );
};
