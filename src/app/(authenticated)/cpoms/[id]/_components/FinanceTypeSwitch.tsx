"use client";

import { SegmentedControl } from "@/app/components/common/SegmentedControl";
import { StructureType } from "@/types/structure.type";

export const FinanceTypeSwitch = ({
  handleChange,
  cpomStructureTypes,
  currentType,
}: Props) => {
  return (
    <SegmentedControl
      name="FinanceTypeSwitch"
      value={currentType}
      options={cpomStructureTypes.map((type) => ({
        id: type,
        isChecked: currentType === type,
        label: type,
        value: type,
      }))}
      onChange={handleChange}
      className="mb-6"
    />
  );
};

type Props = {
  handleChange: (value: string) => void;
  cpomStructureTypes: StructureType[];
  currentType: StructureType;
};
