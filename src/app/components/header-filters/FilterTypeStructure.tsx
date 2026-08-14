"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FiltersTypesCheckbox } from "@/app/components/filters/FiltersTypesCheckbox";
import { useFilterNavigation } from "@/app/hooks/useFilterNavigation";
import { StructureType } from "@/types/structure.type";

const ALL_STRUCTURE_TYPES: StructureType[] = [
  StructureType.CADA,
  StructureType.CAES,
  StructureType.CPH,
  StructureType.HUDA,
];

export const FilterTypeStructure = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigateWithFilter = useFilterNavigation();

  const urlTypes = searchParams.get("types")?.split(",").filter(Boolean);
  const currentTypes =
    urlTypes && urlTypes.length > 0 ? urlTypes : ALL_STRUCTURE_TYPES;

  const isAllChecked = currentTypes.length === ALL_STRUCTURE_TYPES.length;

  const updateUrl = (newTypes: string[]) => {
    navigateWithFilter(
      "types",
      newTypes.length < ALL_STRUCTURE_TYPES.length ? newTypes : [],
      { pathname, scroll: false }
    );
  };

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      updateUrl(ALL_STRUCTURE_TYPES);
    } else {
      updateUrl([]);
    }
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (currentTypes.includes(value)) {
      updateUrl(currentTypes.filter((type) => type !== value));
    } else {
      updateUrl([...currentTypes, value]);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-2">
      <FiltersTypesCheckbox
        label="Tous les types"
        value="all"
        checked={isAllChecked}
        onChange={handleSelectAllChange}
      />
      {ALL_STRUCTURE_TYPES.map((structureType) => (
        <FiltersTypesCheckbox
          key={structureType}
          label={structureType}
          value={structureType}
          checked={currentTypes.includes(structureType)}
          onChange={handleTypeChange}
        />
      ))}
    </div>
  );
};
