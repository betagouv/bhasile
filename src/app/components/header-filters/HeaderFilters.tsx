import { FiltersDepartement } from "@/app/components/filters/FiltersDepartement";

import { FilterDropdown } from "./FilterDropdown";
import { FilterOperateur } from "./FilterOperateur";
import { FilterTypeStructure } from "./FilterTypeStructure";

export const HeaderFilters = () => {
  return (
    <div className="flex">
      <FilterDropdown
        label="Zone"
        placeholder="Sélectionnez une zone"
        filterId="departements"
      >
        <FiltersDepartement />
      </FilterDropdown>

      <FilterDropdown
        label="Opérateurs"
        placeholder="Sélectionnez un opérateur"
        filterId="operateurs"
      >
        <FilterOperateur />
      </FilterDropdown>

      <FilterDropdown
        label="Types Structure"
        placeholder="Sélectionnez un type de structure"
        filterId="type"
      >
        <FilterTypeStructure />
      </FilterDropdown>
    </div>
  );
};
