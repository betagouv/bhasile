import { useFormContext } from "react-hook-form";

import InputWithValidation from "../InputWithValidation";

export const FieldSetDescription = () => {
  const { control } = useFormContext();

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Description
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputWithValidation
          name="name"
          control={control}
          type="text"
          label="Nom de l'opérateur"
          id="name"
        />
        <InputWithValidation
          name="siret"
          control={control}
          type="text"
          label="SIRET"
          id="siret"
        />
        <InputWithValidation
          name="siegeSocial"
          control={control}
          type="text"
          label="Adresse du siège social"
          id="siegeSocial"
        />
      </div>
    </fieldset>
  );
};
