import { StructureFinessFormValues } from "@/schemas/forms/base/finess.schema";

import InputWithValidation from "../InputWithValidation";
import { TransformationCodeSection } from "./TransformationCodeSection";

const emptyStructureFiness: StructureFinessFormValues = {
  description: "",
  finess: {
    code: "",
  },
};

export const TransformationFinessSection = () => {
  return (
    <TransformationCodeSection
      fieldArrayName="structureFinesses"
      emptyItem={emptyStructureFiness}
      addButtonLabel="Ajouter un code FINESS"
      descriptionHint="ex : Toute la structure"
      getDescriptionFieldName={(index) =>
        `structureFinesses.${index}.description`
      }
      renderCodeInput={(index) => (
        <InputWithValidation
          name={`structureFinesses.${index}.finess.code`}
          id={`structureFinesses.${index}.finess.code`}
          type="text"
          label="Code"
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
