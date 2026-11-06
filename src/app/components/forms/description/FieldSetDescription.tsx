import { useFormContext } from "react-hook-form";

import { isCreation as isCreationFormKind } from "@/app/utils/transformation.util";
import { FormKind } from "@/types/global";
import { ACCEPTED_STRUCTURE_TYPES,PublicType } from "@/types/structure.type";

import { OperateurAutocompleteRhf } from "../autocomplete/OperateurAutocompleteRhf";
import InputWithValidation from "../InputWithValidation";
import SelectWithValidation from "../SelectWithValidation";

export const FieldSetDescription = ({
  formKind = FormKind.FINALISATION,
}: Props) => {
  const { control } = useFormContext();

  const title = getTitle(formKind);

  const isCreation = isCreationFormKind(formKind);

  return (
    <>
      <fieldset className="flex flex-col gap-6">
        <legend className="text-xl font-bold mb-10 text-title-blue-france">
          {title}
        </legend>

        {formKind !== FormKind.MODIFICATION && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SelectWithValidation
                name="type"
                control={control}
                label="Type de structure"
                disabled={!isCreation}
                required
                id="type"
              >
                <option value="">Sélectionnez un type</option>
                {ACCEPTED_STRUCTURE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectWithValidation>

              <OperateurAutocompleteRhf />
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {formKind !== FormKind.MODIFICATION && !isCreation ? (
            <InputWithValidation
              name="creationDate"
              control={control}
              type="date"
              label="Date de création de la structure"
              id="creationDate"
            />
          ) : null}
          {!isCreation ? (
            <SelectWithValidation
              name="public"
              control={control}
              label="Public"
              id="public"
            >
              <option value="">Sélectionnez une option</option>
              {Object.values(PublicType).map((publicType) => (
                <option key={publicType} value={publicType}>
                  {publicType}
                </option>
              ))}
            </SelectWithValidation>
          ) : null}
        </div>
      </fieldset>
    </>
  );
};

type Props = {
  formKind?: FormKind;
};

const getTitle = (formKind: FormKind): string => {
  if (
    formKind === FormKind.MODIFICATION ||
    formKind === FormKind.OUVERTURE_EX_NIHILO
  ) {
    return "Général";
  } else if (
    formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
  ) {
    return "Veuillez renseigner les champs suivants en considérant l’ensemble de la nouvelle structure.";
  }
  return "Description";
};
