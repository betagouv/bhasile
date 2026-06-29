import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FiltersTypesCheckbox } from "@/app/components/filters/FiltersTypesCheckbox";
import { StructureType } from "@/types/structure.type";

const ALL_STRUCTURE_TYPES: StructureType[] = [
  StructureType.CADA,
  StructureType.CAES,
  StructureType.CPH,
  StructureType.HUDA,
];

export const FilterTypeStructure = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [types, setTypes] = useState<string[]>(
    searchParams.get("type")?.split(",").filter(Boolean) || []
  );

  const isAllChecked = types.length === ALL_STRUCTURE_TYPES.length;

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setTypes(ALL_STRUCTURE_TYPES);
    } else {
      setTypes([]);
    }
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (types.includes(value)) {
      setTypes(types.filter((type) => type !== value));
    } else {
      setTypes([...types, value]);
    }
  };

  const previousType = useRef(types);
  useEffect(() => {
    if (previousType.current !== types) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (types.length > 0 && types.length < ALL_STRUCTURE_TYPES.length) {
        params.set("type", types.join(","));
      } else {
        params.delete("type");
      }
      router.replace(`?${params.toString()}`);
      previousType.current = types;
    }
  }, [types, searchParams, router]);

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
          checked={types.includes(structureType)}
          onChange={handleTypeChange}
        />
      ))}
    </div>
  );
};
