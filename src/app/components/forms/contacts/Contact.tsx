import { useFormContext } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { getErrorMessages } from "@/app/utils/getErrorMessages.util";

import { DeleteButton } from "../../common/DeleteButton";
import InputWithValidation from "../InputWithValidation";

export const Contact = ({ isMultiAntenne, handleDelete, index }: Props) => {
  const { control, formState } = useFormContext();
  const contactsErrors = getErrorMessages(formState, "contacts", index);
  return (
    <div className="flex gap-6 items-center">
      <fieldset
        className={cn(
          "flex flex-col gap-6 border border-default-grey rounded-xl p-8 flex-1",
          contactsErrors.length > 0 && "border-action-high-error"
        )}
      >
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
      <div className="w-8">
        {handleDelete && (
          <DeleteButton
            onClick={() => handleDelete(index)}
            size="small"
            backgroundColor="grey"
          />
        )}
      </div>
    </div>
  );
};

type Props = {
  isMultiAntenne: boolean;
  handleDelete?: (index: number) => void;
  index: number;
};
