import { FiltersTypesCheckbox } from "@/app/components/filters/FiltersTypesCheckbox";
import { toggleArrayValue } from "@/app/utils/common.util";
import { ACCEPTED_STRUCTURE_TYPES } from "@/types/structure.type";

export const FilterTypeStructure = ({ selection, onChange }: Props) => {
  const handleToggle = (structureType: string) => {
    const nextSelection = toggleArrayValue(selection, structureType);
    onChange(
      nextSelection.length === ACCEPTED_STRUCTURE_TYPES.length
        ? []
        : nextSelection
    );
  };

  return (
    <div className="p-6 flex flex-col gap-2">
      {ACCEPTED_STRUCTURE_TYPES.map((structureType) => (
        <FiltersTypesCheckbox
          key={structureType}
          label={structureType}
          value={structureType}
          checked={selection.includes(structureType)}
          onChange={() => handleToggle(structureType)}
        />
      ))}
    </div>
  );
};

type Props = {
  selection: string[];
  onChange: (selection: string[]) => void;
};
