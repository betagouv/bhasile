import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";

import AddressWithValidation from "../AddressWithValidation";
import InputWithValidation from "../InputWithValidation";

const emptyAntenne: AntenneFormValues = {
  name: "",
  adresseComplete: "",
  adresse: "",
  codePostal: "",
  commune: "",
  departement: "",
};

export const FieldSetAntennes = () => {
  const { control, watch, setValue } = useFormContext();

  const antennes = (watch("antennes") || []) as AntenneFormValues[];

  const isMultiAntenne = watch("isMultiAntenne");

  const antennesLength = antennes.length;
  useEffect(() => {
    if (isMultiAntenne && antennesLength === 0) {
      setValue("antennes", [emptyAntenne, emptyAntenne]);
    }
    if (!isMultiAntenne) {
      setValue("antennes", []);
    }
  }, [isMultiAntenne, antennesLength, setValue]);

  const handleAddNewAntenne = () => {
    setValue("antennes", [...antennes, emptyAntenne]);
  };

  const handleDeleteAntenne = (index: number) => {
    setValue(
      "antennes",
      antennes.filter((_, i) => i !== index)
    );
  };

  if (!isMultiAntenne) {
    return null;
  }

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-lg font-bold mb-2 text-title-blue-france">
        Sites administratifs
      </legend>

      {antennes.map((_, index) => (
        <div key={index} className="flex gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 flex-1">
            <div className="flex flex-col gap-1">
              <InputWithValidation
                name={`antennes.${index}.name`}
                control={control}
                type="text"
                label="Nom du site"
                className="mb-0"
              />
              <span className="text-[#666666] text-sm">ex. Avranches Nord</span>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <AddressWithValidation
                control={control}
                fullAddress={`antennes.${index}.adresseComplete`}
                id={`antennes.${index}.adresseComplete`}
                zipCode={`antennes.${index}.codePostal`}
                street={`antennes.${index}.adresse`}
                city={`antennes.${index}.commune`}
                department={`antennes.${index}.departement`}
                label="Adresse"
              />
            </div>
          </div>
          {index >= 2 && (
            <Button
              iconId="fr-icon-delete-bin-line"
              priority="tertiary no outline"
              className="mt-8"
              title="Supprimer"
              onClick={() => handleDeleteAntenne(index)}
              type="button"
            />
          )}
        </div>
      ))}
      <Button
        type="button"
        iconId="fr-icon-add-line"
        priority="tertiary no outline"
        className="underline font-normal p-0"
        onClick={handleAddNewAntenne}
      >
        Ajouter un site administratif
      </Button>
    </fieldset>
  );
};
