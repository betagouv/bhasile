import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Notice from "@codegouvfr/react-dsfr/Notice";
import { useFormContext } from "react-hook-form";

import { FormKind } from "@/types/global";

import { FieldSetAdresseAdministrative } from "./FieldSetAdresseAdministrative";
import { FieldSetAntennes } from "./FieldSetAntennes";

export const AdresseAdministrativeAndAntennes = ({
  formKind = FormKind.FINALISATION,
}: {
  formKind?: FormKind;
}) => {
  const { watch, setValue } = useFormContext();

  const isMultiAntenne = watch("isMultiAntenne");

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">
        Adresses administratives
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
