import { FinessFormValues } from "@/schemas/forms/base/finess.schema";

import InputWithValidation from "../InputWithValidation";
import { TransformationCodeSection } from "./TransformationCodeSection";

const emptyFiness: FinessFormValues = {
  code: "",
  description: "",
};

export const TransformationFinessSection = () => {
  return (
    <TransformationCodeSection
      fieldArrayName="finesses"
      emptyItem={emptyFiness}
      singleCodeLabel="Code FINESS"
      addButtonLabel="Ajouter un code FINESS"
      descriptionHint="ex : Toute la structure"
      getDescriptionFieldName={(index) => `finesses.${index}.description`}
      renderCodeInput={(index, label) => (
        <InputWithValidation
          name={`finesses.${index}.code`}
          id={`finesses.${index}.code`}
          type="text"
          label={label}
        />
      )}
      title={
        <>
          Veuillez ne retenir qu’un seul code FINESS pour l’ensemble de la
          structure (sauf cas exceptionnels).
        </>
      }
      noticeDescription="Veuillez vous assurer que la base FINESS est à jour."
    />
  );
};
