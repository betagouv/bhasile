import { useFormContext } from "react-hook-form";

import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { Repartition, RepartitionLabel } from "@/types/adresse.type";
import { FormKind } from "@/types/global";
import { PublicType } from "@/types/structure.type";

export const FieldSetTypeBati = ({ formKind }: Props) => {
  const { control } = useFormContext();

  const isCreation =
    formKind === FormKind.OUVERTURE_EX_NIHILO ||
    formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES;
  return (
    <fieldset className="grid grid-cols-3 gap-6">
      {isCreation && (
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
    </fieldset>
  );
};

type Props = {
  formKind?: FormKind;
};
