import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useFilterNavigation } from "@/app/hooks/useFilterNavigation";
import { StructureType } from "@/types/structure.type";

import { FiltersTypesCheckbox } from "./FiltersTypesCheckbox";

export const FiltersTypes = () => {
  const searchParams = useSearchParams();
  const navigateWithFilter = useFilterNavigation();

  const [types, setTypes] = useState(
    searchParams.get("type")?.split(",").filter(Boolean) || []
  );

  const noFilterOnType = types.length === 0;

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (noFilterOnType) {
      const allTypes: StructureType[] = [
        StructureType.CADA,
        StructureType.CPH,
        StructureType.HUDA,
        StructureType.CAES,
        StructureType.PRAHDA,
      ];
      setTypes(allTypes.filter((structureType) => structureType !== value));
      return;
    }
    if (types.includes(value)) {
      setTypes(types.filter((structureType) => structureType !== value));
    } else {
      if (types.length >= 4) {
        setTypes([]);
      } else {
        setTypes([...types, value]);
      }
    }
  };

  const previousType = useRef(types);
  useEffect(() => {
    if (previousType.current !== types) {
      navigateWithFilter("type", types);
      previousType.current = types;
    }
  }, [types, navigateWithFilter]);

  return (
    <div className="p-6">
      <fieldset>
        <legend className="text-title-blue-france text-sm font-medium mb-4">
          Type de structure
        </legend>
        <div className="grid grid-cols-3 gap-x-3 gap-y-2">
          {(["CADA", "CAES", "CPH", "HUDA", "PRAHDA"] as StructureType[]).map(
            (structureType) => (
              <FiltersTypesCheckbox
                key={structureType}
                label={structureType}
                value={structureType}
                checked={types.includes(structureType) || noFilterOnType}
                onChange={handleTypeChange}
              />
            )
          )}
        </div>
      </fieldset>
    </div>
  );
};
