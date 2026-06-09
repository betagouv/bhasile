import { useFormContext } from "react-hook-form";

import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import {
  getTransformationNounAvecArticle,
  isCreation,
  isTransformationSurStructureExistante,
} from "@/app/utils/transformation.util";
import { Repartition, RepartitionLabel } from "@/types/adresse.type";
import { FormKind } from "@/types/global";
import { PublicType } from "@/types/structure.type";

export const FieldSetTypeBati = ({
  formKind = FormKind.FINALISATION,
}: Props) => {
  const { control } = useFormContext();

  const showPublic =
    isCreation(formKind) || isTransformationSurStructureExistante(formKind);

  return (
    <fieldset className="flex flex-col gap-6">
      {isTransformationSurStructureExistante(formKind) && (
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          {`Veuillez renseigner les champs suivants en considérant l’ensemble de la structure une fois ${getTransformationNounAvecArticle(
            formKind
          )} effective.`}
        </legend>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {showPublic && (
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
        )}
        <SelectWithValidation
          name="typeBati"
          control={control}
          label="Type de bâti"
          id="typeBati"
        >
          <option value="">Sélectionnez une option</option>

          {Object.values(Repartition).map((repartition) => (
            <option key={repartition} value={repartition}>
              {RepartitionLabel[repartition]}
            </option>
          ))}
        </SelectWithValidation>
      </div>
    </fieldset>
  );
};

type Props = {
  formKind?: FormKind;
};
