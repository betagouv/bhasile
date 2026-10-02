import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

import { StructureType } from "@/types/structure.type";

export const FiltersTypesCheckbox = ({
  label,
  value,
  checked,
  onChange,
}: Props) => {
  return (
    <Checkbox
      options={[
        {
          label,
          nativeInputProps: {
            name: "structure-type",
            value,
            checked,
            onChange: onChange,
          },
        },
      ]}
      className={"[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0"}
      small
    />
  );
};

type Props = {
  label: string;
  value: StructureType;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
