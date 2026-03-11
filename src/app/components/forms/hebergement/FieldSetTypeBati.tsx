import { useFormContext } from "react-hook-form";

import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { Repartition } from "@/types/adresse.type";

export const FieldSetTypeBati = () => {
  const { control } = useFormContext();
  return (
    <fieldset className="flex flex-col gap-6">
      <SelectWithValidation
        name="typeBati"
        control={control}
        label="Type de bâti"
        id="typeBati"
        className="max-w-xs"
      >
        <option value="">Sélectionnez une option</option>

        {Object.values(Repartition).map((repartition) => (
          <option key={repartition} value={repartition}>
            {repartition}
          </option>
        ))}
      </SelectWithValidation>
    </fieldset>
  );
};
