import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { getDepartementFromCodePostal } from "@/app/utils/adresse.util";

import InputWithValidation from "../InputWithValidation";

export const ManualAddressInputs = () => {
  const { control, watch, setValue } = useFormContext();

  const codePostalAdministratif = watch("codePostalAdministratif");
  useEffect(() => {
    if (codePostalAdministratif) {
      setValue(
        "departementAdministratif",
        getDepartementFromCodePostal(codePostalAdministratif)
      );
    }
  }, [codePostalAdministratif, setValue]);

  return (
    <div className="grid grid-cols-7 gap-6">
      <InputWithValidation
        name="adresseAdministrative"
        control={control}
        type="text"
        label="Adresse complète"
        className="col-span-4"
      />
      <InputWithValidation
        name="codePostalAdministratif"
        control={control}
        type="text"
        label="Code postal"
      />
      <InputWithValidation
        name="communeAdministrative"
        control={control}
        type="text"
        label="Commune"
        className="col-span-2"
      />
    </div>
  );
};
