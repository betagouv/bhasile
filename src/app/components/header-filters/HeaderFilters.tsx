import { FiltersDepartement } from "@/app/components/filters/FiltersDepartement";
import { formatPlural } from "@/app/utils/string.util";
import { buildZoneSummary } from "@/app/utils/zone.util";
import { buildTypesSummary } from "@/utils/structure-type.util";

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
        renderOptions={({ selection, setSelection }) => (
          <FiltersDepartement
            departements={selection}
            onChange={setSelection}
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
        renderOptions={({ selection, toggleValue }) => (
          <FilterOperateur selection={selection} onToggle={toggleValue} />
        )}
      />

      <FilterDropdown
        label="Types Structure"
        placeholder="Tous les types"
        filterId="types"
        getSummaryLabel={buildTypesSummary}
        renderOptions={({ selection, setSelection }) => (
          <FilterTypeStructure selection={selection} onChange={setSelection} />
        )}
      />
    </div>
  );
};
