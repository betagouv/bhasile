import { useFormContext } from "react-hook-form";

import AddressWithValidation from "../AddressWithValidation";
import InputWithValidation from "../InputWithValidation";

export const FieldSetSiegeSocial = () => {
  const { control, setValue, getValues } = useFormContext();

  const handleAddressAdministrativeChange = () => {
    setTimeout(() => {
      const currentAdresses = getValues("adresses") || [];
      if (currentAdresses.length > 0) {
        const updatedAdresses = [
          {
            ...currentAdresses[0],
            adresseComplete: getValues("adresseAdministrativeComplete"),
            adresse: getValues("adresseAdministrative"),
            codePostal: getValues("codePostalAdministratif"),
            commune: getValues("communeAdministrative"),
            departement: getValues("departementAdministratif"),
          },
        ];
        setValue("adresses", updatedAdresses, {
          shouldValidate: true,
        });
      }
    }, 100);
  };

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
          onSelectSuggestion={handleAddressAdministrativeChange}
        />
      </div>
    </fieldset>
  );
};
