import { SegmentedControl } from "@/app/components/common/SegmentedControl";

export const StructureCpomSwitch = ({ handleChange }: Props) => {
  return (
    <SegmentedControl
      name="StructureCpomSwitch"
      options={[
        {
          id: "structure",
          isChecked: true,
          label: "Structure",
          value: "structure",
          icon: "fr-icon-community-line",
        },
        {
          id: "cpom",
          isChecked: false,
          label: "CPOM",
          value: "cpom",
          icon: "fr-icon-shape-line",
        },
      ]}
      onChange={handleChange}
      className="mb-6"
    />
  );
};

type Props = {
  handleChange: (value: string) => void;
};
