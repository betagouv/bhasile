import { useFormContext } from "react-hook-form";

import AddressWithValidation from "../AddressWithValidation";
import InputWithValidation from "../InputWithValidation";

export const FieldSetSiegeSocial = () => {
  const { control } = useFormContext();

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Siège social
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputWithValidation
          name="siret"
          control={control}
          type="text"
          label="SIRET"
          id="siret"
        />
        <AddressWithValidation
          control={control}
          fullAddress="siegeSocial"
          id="siegeSocial"
          zipCode="codePostal"
          street="adresse"
          city="commune"
          department="departement"
          label="Adresse"
        />
      </div>
    </fieldset>
  );
};
