import { FiltersDepartement } from "@/app/components/filters/FiltersDepartement";

import { FilterDropdown } from "./FilterDropdown";
import { FilterOperateur } from "./FilterOperateur";
import { FilterTypeStructure } from "./FilterTypeStructure";

export const StatistiquesFilters = () => {
  return (
    <div className="flex">
      <FilterDropdown label="Zone" placeholder="Sélectionnez une zone">
        <FiltersDepartement />
      </FilterDropdown>

      <FilterDropdown
        label="Opérateurs"
        placeholder="Sélectionnez un opérateur"
      >
        <FilterOperateur />
      </FilterDropdown>

      <FilterDropdown
        label="Types Structure"
        placeholder="Sélectionnez un type de structure"
      >
        <FilterTypeStructure />
      </FilterDropdown>
    </div>
  );
};
