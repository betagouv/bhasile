import { useFormContext } from "react-hook-form";

import InputWithValidation from "../InputWithValidation";

export const FieldSetDirectionGenerale = () => {
  const { control } = useFormContext();

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Direction générale
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputWithValidation
          name="directionGenerale"
          control={control}
          type="text"
          label="Nom"
          id="directionGenerale"
        />
      </div>
    </fieldset>
  );
};
