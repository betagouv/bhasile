import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Control, Controller, FieldValues } from "react-hook-form";

import AddressWithValidation from "@/app/components/forms/AddressWithValidation";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { Repartition } from "@/types/adresse.type";

export const AdresseComponent = ({
  index,
  control,
  sameAddress,
  handleRemoveAddress,
  typeBati,
}: Props) => {
  return (
    <div className="flex max-sm:flex-col gap-6" key={`address-${index}`}>
      <AddressWithValidation
        id={`adresses.${index}.adresseComplete`}
        control={control}
        fullAddress={`adresses.${index}.adresseComplete`}
        zipCode={`adresses.${index}.codePostal`}
        street={`adresses.${index}.adresse`}
        department={`adresses.${index}.departement`}
        city={`adresses.${index}.commune`}
        latitude={`adresses.${index}.latitude`}
        longitude={`adresses.${index}.longitude`}
        label="Adresse"
        className="w-1/3"
        disabled={sameAddress}
      />
      <InputWithValidation
        name={`adresses.${index}.adresseTypologies.0.placesAutorisees`}
        id={`adresses.${index}.adresseTypologies.0.placesAutorisees`}
        control={control}
        type="number"
        min={0}
        label="Places"
        className="w-1/12 mb-0"
      />
      <SelectWithValidation
        name={`adresses.${index}.repartition`}
        id={`adresses.${index}.repartition`}
        control={control}
        label="Type de bâti"
        hidden={typeBati !== Repartition.MIXTE}
        required
      >
        <option value="">Sélectionnez une option</option>
        {Object.values(Repartition)
          .filter((repartition) => repartition !== Repartition.MIXTE)
          .map((repartition) => (
            <option key={repartition} value={repartition}>
              {repartition}
            </option>
          ))}
      </SelectWithValidation>
      <div className="flex grow flex-col gap-2">
        <label htmlFor={`adresses.${index}.adresseTypologies`}>
          Particularités
        </label>
        <div className="flex w-full gap-4 items-center min-h-[2.6rem]">
          <Controller
            control={control}
            name={`adresses.${index}.adresseTypologies.0.logementSocial`}
            render={({ field }) => (
              <Checkbox
                options={[
                  {
                    label: "Logement social",
                    nativeInputProps: {
                      name: field.name,
                      checked: field.value,
                      onChange: field.onChange,
                    },
                  },
                ]}
              />
            )}
          />
          <Controller
            control={control}
            name={`adresses.${index}.adresseTypologies.0.qpv`}
            render={({ field }) => (
              <Checkbox
                options={[
                  {
                    label: "QPV",
                    nativeInputProps: {
                      name: field.name,
                      checked: field.value,
                      onChange: field.onChange,
                    },
                  },
                ]}
              />
            )}
          />

          {index !== 0 && typeBati !== Repartition.COLLECTIF && (
            <Button
              iconId="fr-icon-delete-line"
              className="ml-auto rounded-4xl"
              onClick={(e) => {
                e.preventDefault();
                handleRemoveAddress(index);
              }}
              priority="tertiary no outline"
              title="Supprimer l'hébergement"
            />
          )}
        </div>
      </div>
    </div>
  );
};

type Props = {
  index: number;
  control: Control<FieldValues>;
  sameAddress: boolean;
  handleRemoveAddress: (index: number) => void;
  typeBati: Repartition;
};
