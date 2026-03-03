import { Button } from "@codegouvfr/react-dsfr/Button";
import { Control, FieldValues } from "react-hook-form";

import InputWithValidation from "../InputWithValidation";

export const Contact = ({
  control,
  isMultiAntenne,
  handleDelete,
  index,
}: Props) => {
  return (
    <div className="flex gap-6">
      <fieldset className="flex flex-col gap-6 border border-default-grey rounded-xl p-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputWithValidation
            name={`contacts.${index}.prenom`}
            id={`contacts.${index}.prenom`}
            control={control}
            type="text"
            label="Prénom"
          />
          {isMultiAntenne ? (
            <InputWithValidation
              name={`contacts.${index}.perimetre`}
              id={`contacts.${index}.perimetre`}
              control={control}
              type="text"
              label="Périmètre"
            />
          ) : (
            <div />
          )}
          <InputWithValidation
            name={`contacts.${index}.nom`}
            id={`contacts.${index}.nom`}
            control={control}
            type="text"
            label="Nom"
          />
          <InputWithValidation
            name={`contacts.${index}.role`}
            id={`contacts.${index}.role`}
            control={control}
            type="text"
            label="Fonction"
          />
          <InputWithValidation
            name={`contacts.${index}.id`}
            id={`contacts.${index}.id`}
            control={control}
            type="hidden"
            label="id"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputWithValidation
            name={`contacts.${index}.email`}
            id={`contacts.${index}.email`}
            control={control}
            type="email"
            label="Email"
          />
          <InputWithValidation
            name={`contacts.${index}.telephone`}
            id={`contacts.${index}.telephone`}
            control={control}
            type="tel"
            label="Téléphone"
          />
        </div>
      </fieldset>
      {handleDelete && (
        <Button
          iconId="fr-icon-delete-bin-line"
          priority="tertiary no outline"
          size="small"
          className="!rounded-full !bg-white"
          title="Supprimer le contact"
          onClick={() => handleDelete(index)}
        />
      )}
    </div>
  );
};

type Props = {
  control: Control<FieldValues>;
  isMultiAntenne: boolean;
  handleDelete?: (index: number) => void;
  index: number;
};
