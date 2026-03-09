import Notice from "@codegouvfr/react-dsfr/Notice";
import { useFormContext } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import AddressWithValidation from "../../AddressWithValidation";
import InputWithValidation from "../../InputWithValidation";
import SelectWithValidation from "../../SelectWithValidation";

export const FieldSetAdresseAdministrative = ({
  formKind = FormKind.FINALISATION,
}: {
  formKind?: FormKind;
}) => {
  const { control, watch, setValue, getValues } = useFormContext();

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

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Adresse administrative
      </legend>
      {formKind === FormKind.FINALISATION && (
        <Notice
          severity="info"
          title=""
          className="rounded [&_p]:flex [&_p]:items-center [&_.fr-notice\_\_desc]:text-text-default-grey [&_div_div]:px-4 [&_div_div]:py-3 [&_div]:px-0 py-0"
          description="L’ensemble des adresses ne seront communiquées qu’aux agentes et agents en charge de cette politique publique."
        />
      )}
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
    </fieldset>
  );
};
