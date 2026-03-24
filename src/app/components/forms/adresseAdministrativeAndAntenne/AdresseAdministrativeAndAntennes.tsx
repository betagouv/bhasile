import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useFormContext } from "react-hook-form";

import { CustomNotice } from "@/app/components/common/CustomNotice";

import { FieldSetAdresseAdministrative } from "./FieldSetAdresseAdministrative";
import { FieldSetAntennes } from "./FieldSetAntennes";

export const AdresseAdministrativeAndAntennes = () => {
  const { watch, setValue } = useFormContext();

  const isMultiAntenne = watch("isMultiAntenne");

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">
        Adresses administratives
      </h2>
      <CustomNotice
        severity="info"
        title=""
        description="La structure représente l’ensemble de l’établissement, défini dans les documents de contractualisation et financiers. Il se peut que la structure soit répartie sur plusieurs sites administratifs géographiquement distants. Attention, on ne parle pas ici d’adresses d’hébergement (même dans le cas d’un bâti diffus ou mixte), celles-ci seront demandées à l’étape suivante."
      />
      <Checkbox
        options={[
          {
            label:
              "La structure est répartie sur plusieurs sites administratifs géographiquement distants.",
            nativeInputProps: {
              name: "isMultiAntenne",
              checked: isMultiAntenne,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setValue("isMultiAntenne", e.target.checked);
              },
            },
          },
        ]}
      />
      <FieldSetAdresseAdministrative />
      <FieldSetAntennes />
    </>
  );
};
