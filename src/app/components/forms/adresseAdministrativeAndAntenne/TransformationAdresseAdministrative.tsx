import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import {
  AdresseSource,
  getTransformationNounAvecArticle,
} from "@/app/utils/transformation.util";
import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";
import { FormKind } from "@/types/global";

import { AdresseAdministrativeAndAntennes } from "./AdresseAdministrativeAndAntennes";

const ADRESSE_FIELD_NAMES: readonly (keyof AdresseSource)[] = [
  "nom",
  "adresseAdministrative",
  "adresseAdministrativeComplete",
  "codePostalAdministratif",
  "communeAdministrative",
  "departementAdministratif",
];

type Props = {
  formKind: FormKind;
  originalAdresse: AdresseSource;
  originalAntennes: AntenneFormValues[];
};

export const TransformationAdresseAdministrative = ({
  formKind,
  originalAdresse,
  originalAntennes,
}: Props) => {
  const { getValues, setValue } = useFormContext();

  const [hasAdresseChanged, setHasAdresseChanged] = useState<
    boolean | undefined
  >(() =>
    ADRESSE_FIELD_NAMES.some(
      (fieldName) => (getValues(fieldName) ?? "") !== originalAdresse[fieldName]
    )
      ? true
      : undefined
  );

  const handleDidTransformationChangeAdresse = (changed: boolean) => {
    setHasAdresseChanged(changed);
    ADRESSE_FIELD_NAMES.forEach((fieldName) => {
      if (changed) {
        setValue(fieldName, "");
      } else {
        setValue(fieldName, originalAdresse[fieldName], {
          shouldValidate: true,
        });
      }
    });
  };

  const title = `Est-ce que le nom d’usage de la structure et/ou son adresse administrative principale changent suite à ${getTransformationNounAvecArticle(
    formKind
  )} ?`;

  return (
    <>
      <div className="flex gap-6">
        <h2
          id="hasAdresseChanged-title"
          className="text-xl font-bold mb-4 text-title-blue-france flex-1"
        >
          {title}
        </h2>
        <RadioButtons
          aria-labelledby="hasAdresseChanged-title"
          orientation="horizontal"
          name="hasAdresseChanged"
          options={[
            {
              label: "Oui",
              nativeInputProps: {
                checked: hasAdresseChanged === true,
                onChange: () => handleDidTransformationChangeAdresse(true),
              },
            },
            {
              label: "Non",
              nativeInputProps: {
                checked: hasAdresseChanged === false,
                onChange: () => handleDidTransformationChangeAdresse(false),
              },
            },
          ]}
          className="mr-10"
        />
      </div>
      <AdresseAdministrativeAndAntennes
        formKind={formKind}
        isAdresseAdministrativeLocked={!hasAdresseChanged}
        originalAntennes={originalAntennes}
      />
    </>
  );
};
