import Button from "@codegouvfr/react-dsfr/Button";
import { useFormContext } from "react-hook-form";

import { areAllValuesEmpty } from "@/app/utils/common.util";
import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";

import { DeleteButton } from "../../common/DeleteButton";
import AddressWithValidation from "../AddressWithValidation";
import InputWithValidation from "../InputWithValidation";

export const emptyAntenne: AntenneFormValues = {
  name: "",
  adresseComplete: "",
  adresse: "",
  codePostal: "",
  commune: "",
  departement: "",
};

export const MIN_ANTENNES = 2;

export const FieldSetAntennes = ({
  locked = false,
  showTitle = true,
}: {
  locked?: boolean;
  showTitle?: boolean;
} = {}) => {
  const { control, watch, setValue } = useFormContext();

  const antennes = (watch("antennes") || []) as AntenneFormValues[];

  const handleAddNewAntenne = () => {
    setValue("antennes", [...antennes, emptyAntenne]);
  };

  const handleDeleteAntenne = (index: number) => {
    if (antennes.length > MIN_ANTENNES) {
      setValue(
        "antennes",
        antennes.filter((_, antenneIndex) => antenneIndex !== index)
      );
      return;
    }
    setValue(
      "antennes",
      antennes.map((antenne, antenneIndex) =>
        antenneIndex === index ? emptyAntenne : antenne
      )
    );
  };

  return (
    <fieldset className="flex flex-col gap-6">
      {showTitle && (
        <legend className="text-lg font-bold mb-2 text-title-blue-france">
          Sites administratifs
        </legend>
      )}

      {antennes.map((antenne, index) => (
        <div key={index} className="flex gap-6 items-end">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 flex-1">
            <div className="flex flex-col gap-1">
              <InputWithValidation
                name={`antennes.${index}.name`}
                control={control}
                type="text"
                label="Nom du site"
                className="mb-0"
                disabled={locked}
              />
              <span className="text-[#666666] text-sm">
                ex : Avranches Nord
              </span>
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
                disabled={locked}
              />
            </div>
          </div>
          <div className="w-8 mb-7">
            {!locked &&
              (antennes.length > MIN_ANTENNES ||
                !areAllValuesEmpty(antenne)) && (
                <DeleteButton
                  onClick={() => handleDeleteAntenne(index)}
                  size="small"
                  backgroundColor="grey"
                />
              )}
          </div>
        </div>
      ))}
      <Button
        type="button"
        iconId="fr-icon-add-line"
        priority="tertiary no outline"
        className="underline font-normal p-0"
        onClick={handleAddNewAntenne}
        disabled={locked}
      >
        Ajouter un site administratif
      </Button>
    </fieldset>
  );
};
