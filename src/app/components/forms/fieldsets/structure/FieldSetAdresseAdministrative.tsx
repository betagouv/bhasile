import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
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
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">
        Adresse administrative
      </h2>
      {formKind !== FormKind.MODIFICATION && (
        <Notice
          severity="info"
          title=""
          className="rounded [&_p]:flex  [&_p]:items-center"
          description="La structure représente l’ensemble de l’établissement, défini dans les documents de contractualisation et financiers. Il se peut que la structure soit répartie sur plusieurs antennes administratives géographiquement distantes. Attention, on ne parle pas ici d’adresses d’hébergement (même dans le cas d’un bâti diffus ou mixte), celles-ci seront demandées à l’étape suivante."
        />
      )}
      <Checkbox
        options={[
          {
            label:
              "La structure est répartie sur plusieurs antennes administratives géographiquement distantes. ",
            nativeInputProps: {
              name: "isMultiAntenne",
              checked: watch("isMultiAntenne"),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setValue("isMultiAntenne", e.target.checked);
              },
            },
          },
        ]}
      />
      <fieldset className="flex flex-col gap-6">
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
    </>
  );
};
