import Button from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import AddressWithValidation from "../AddressWithValidation";
import InputWithValidation from "../InputWithValidation";
import SelectWithValidation from "../SelectWithValidation";
import { ManualAddressInputs } from "./ManualAddressInputs";

export const FieldSetAdresseAdministrative = ({
  formKind = FormKind.FINALISATION,
}: {
  formKind?: FormKind;
}) => {
  const { control, watch, setValue, getValues } = useFormContext();

  const [isManualAddress, setIsManualAddress] = useState(false);

  const handleAddressAdministrativeChange = () => {
    if (watch("typeBati") === Repartition.COLLECTIF && watch("sameAddress")) {
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
    }
  };

  const handleManualAddressChange = () => {
    setIsManualAddress((prevIsManualAddress) => !prevIsManualAddress);
    setValue("adresseAdministrativeComplete", "");
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-bold mb-2 text-title-blue-france">
        Structure
      </legend>
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          formKind === FormKind.MODIFICATION
            ? "md:grid-cols-4"
            : "md:grid-cols-3"
        )}
      >
        <div className="flex flex-col gap-1">
          <InputWithValidation
            name="nom"
            control={control}
            type="text"
            label="Nom de la structure (optionnel)"
            className="mb-0"
          />
          <span className="text-[#666666] text-sm">ex. Les Coquelicots</span>
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <AddressWithValidation
            control={control}
            fullAddress="adresseAdministrativeComplete"
            id="adresseAdministrativeComplete"
            zipCode="codePostalAdministratif"
            street="adresseAdministrative"
            city="communeAdministrative"
            department="departementAdministratif"
            label="Adresse principale de la structure"
            onSelectSuggestion={handleAddressAdministrativeChange}
            disabled={isManualAddress}
          />
          <span className="text-[#666666] text-sm">
            indiquée dans les documents de contractualisation
          </span>
        </div>
        {formKind === FormKind.MODIFICATION && (
          <SelectWithValidation
            name="typeBati"
            control={control}
            label="Type de bâti"
            id="typeBati"
          >
            <option value="">Sélectionnez une option</option>

            {Object.values(Repartition).map((repartition) => (
              <option key={repartition} value={repartition}>
                {repartition}
              </option>
            ))}
          </SelectWithValidation>
        )}
      </div>
      <Button
        priority="tertiary no outline"
        type="button"
        iconId={
          isManualAddress ? "fr-icon-arrow-go-back-line" : "fr-icon-add-line"
        }
        className="underline font-normal p-0"
        onClick={handleManualAddressChange}
      >
        {isManualAddress
          ? "Revenir à la saisie simplifiée de l’adresse"
          : "Saisir l’adresse manuellement"}
      </Button>
      {isManualAddress && <ManualAddressInputs />}
    </fieldset>
  );
};
