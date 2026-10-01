"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FiltersTypesCheckbox } from "@/app/components/filters/FiltersTypesCheckbox";
import { useFilterNavigation } from "@/app/hooks/useFilterNavigation";
import { ACCEPTED_STRUCTURE_TYPES } from "@/types/structure.type";

export const FilterTypeStructure = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigateWithFilter = useFilterNavigation();

  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    return searchParams.get("types")?.split(",").filter(Boolean) || [];
  });

  const isAllChecked =
    ACCEPTED_STRUCTURE_TYPES.length > 0 &&
    ACCEPTED_STRUCTURE_TYPES.every((structureType) =>
      selectedTypes.includes(structureType)
    );

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setSelectedTypes([...ACCEPTED_STRUCTURE_TYPES]);
    } else {
      setSelectedTypes([]);
    }
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = event.target.value;

    if (selectedTypes.includes(selectedValue)) {
      setSelectedTypes(
        selectedTypes.filter((structureType) => structureType !== selectedValue)
      );
    } else {
      setSelectedTypes([...selectedTypes, selectedValue]);
    }
  };

  useEffect(() => {
    const newValue = selectedTypes.join(",");
    const currentValue = searchParams.get("types") || "";

    if (currentValue === newValue) {
      return;
    }

    navigateWithFilter("types", selectedTypes, { pathname, scroll: false });
  }, [selectedTypes, searchParams, navigateWithFilter, pathname]);

  return (
    <div className="p-6 flex flex-col gap-2">
      <FiltersTypesCheckbox
        label="Tous les types"
        value="all"
        checked={isAllChecked}
        onChange={handleSelectAllChange}
      />
      {ACCEPTED_STRUCTURE_TYPES.map((structureType) => (
        <FiltersTypesCheckbox
          key={structureType}
          label={structureType}
          value={structureType}
          checked={selectedTypes.includes(structureType)}
          onChange={handleTypeChange}
        />
      ))}
    </div>
  );
};
