import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useFetchFreeDnaCodes } from "@/app/hooks/useFetchFreeDnaCodes";
import { EntityId } from "@/types/Entity.type";

import SelectWithValidation from "../SelectWithValidation";

export const DnaInput = ({ index, label, disabled, entityId }: Props) => {
  const { control, setValue } = useFormContext();

  const name = `dnaStructures.${index}.dna.code`;

  const [operateurId, departementAdministratif, type, selectedCode] = useWatch({
    control,
    name: ["operateur.id", "departementAdministratif", "type", name],
  });

  const { freeDnaCodes } = useFetchFreeDnaCodes({
    entityId,
    operateurId,
    departementAdministratif,
    type,
  });

  useEffect(() => {
    const isSelectedCodeUnavailable =
      !disabled &&
      !!freeDnaCodes &&
      !!selectedCode &&
      !freeDnaCodes.some((dna) => dna.code === selectedCode);

    if (isSelectedCodeUnavailable) {
      setValue(name, "", { shouldDirty: true });
    }
  }, [disabled, freeDnaCodes, selectedCode, name, setValue]);

  return (
    <SelectWithValidation
      name={name}
      id={name}
      control={control}
      label={label}
      className="mb-0 [&_label]:text-black! [&_input]:text-black!"
      disabled={disabled}
    >
      <option value="" disabled>
        Sélectionnez un code DNA
      </option>
      {freeDnaCodes?.map((dna) => (
        <option key={dna.code} value={dna.code}>
          {dna.code} ({dna.departementAdministratif})
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
