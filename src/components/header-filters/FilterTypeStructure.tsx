import { toggleArrayValue } from "@/app/utils/common.util";
import { ACCEPTED_STRUCTURE_TYPES } from "@/types/structure.type";

import { FiltersTypesCheckbox } from "./FiltersTypesCheckbox";

export const FilterTypeStructure = ({ selection, onChange }: Props) => {
  return (
    <div className="p-6 flex flex-col gap-2">
      {ACCEPTED_STRUCTURE_TYPES.map((structureType) => (
        <FiltersTypesCheckbox
          key={structureType}
          label={structureType}
          value={structureType}
          checked={selection.includes(structureType)}
          onChange={() => onChange(toggleArrayValue(selection, structureType))}
        />
      ))}
    </div>
  );
};

type Props = {
  selection: string[];
  onChange: (selection: string[]) => void;
};
