import { useFormContext } from "react-hook-form";

import { useFetchFreeDnaCodes } from "@/app/hooks/useFetchFreeDnaCodes";
import { EntityId } from "@/types/Entity.type";

import SelectWithValidation from "../SelectWithValidation";

export const DnaInput = ({ index, label, disabled, entityId }: Props) => {
  const { control } = useFormContext();

  const { freeDnaCodes } = useFetchFreeDnaCodes({ entityId });

  return (
    <SelectWithValidation
      name={`dnaStructures.${index}.dna.code`}
      id={`dnaStructures.${index}.dna.code`}
      control={control}
      label={label}
      className="mb-0 [&_label]:text-black! [&_input]:text-black!"
      disabled={disabled}
    >
      <option value="" disabled>
        Sélectionnez un code DNA
      </option>
      {freeDnaCodes.map((dna) => (
        <option key={dna.code} value={dna.code}>
          {dna.code}
        </option>
      ))}
    </SelectWithValidation>
  );
};

type Props = {
  index: number;
  label: string;
  disabled?: boolean;
  entityId?: EntityId;
};
