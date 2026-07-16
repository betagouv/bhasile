import { FiltersDepartement } from "@/app/components/filters/FiltersDepartement";

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
