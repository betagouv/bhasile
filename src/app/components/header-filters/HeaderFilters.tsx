import { FiltersDepartement } from "@/app/components/filters/FiltersDepartement";
import { buildZoneSummary } from "@/app/utils/zone.util";

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
        <FiltersDepartement />
      </FilterDropdown>

      <FilterDropdown
        label="Opérateurs"
        placeholder="Tous les opérateurs"
        filterId="operateurs"
      >
        <FilterOperateur />
      </FilterDropdown>

      <FilterDropdown
        label="Types Structure"
        placeholder="Tous les types de structure"
        filterId="type"
      >
        <FilterTypeStructure />
      </FilterDropdown>
    </div>
  );
};
