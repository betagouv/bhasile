"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SaveCurrentForm } from "@/app/components/forms/SaveCurrentForm";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getActesAdministratifsDefaultValues } from "@/app/utils/acteAdministratif.util";
import { getCreationActesAdministratifsCategoryToDisplay } from "@/config/transformation.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  StructureTransformationApiRead,
  StructureTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  ActesAdministratifsAutoSaveFormValues,
  actesAdministratifsAutoSaveSchema,
  actesAdministratifsCreationSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";

type Props = {
  structureTransformation: StructureTransformationApiRead;
  transformation: TransformationApiRead;
};

export const CreationActesAdministratifsForm = ({
  structureTransformation,
  transformation,
}: Props) => {
  const { handleValidation, handleSave, prevStep } =
    useTransformationFormHandling();

  const categoryDisplayRules = getCreationActesAdministratifsCategoryToDisplay(
    transformation.type
  );

  const defaultValues = {
    actesAdministratifs: getActesAdministratifsDefaultValues(
      structureTransformation.actesAdministratifs,
      categoryDisplayRules
    ),
  };

  const buildStructureTransformation = (
    data: ActesAdministratifsAutoSaveFormValues
  ): StructureTransformationApiUpdateClient => ({
    id: structureTransformation.id,
    type: structureTransformation.type,
    forms: structureTransformation.forms,
    actesAdministratifs: (data.actesAdministratifs ??
      []) as ActeAdministratifApiType[],
  });

  return (
    <FormWrapper
      schema={actesAdministratifsCreationSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureTransformation: buildStructureTransformation(data),
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      previousStep={prevStep?.route}
      showContactInfos={false}
    >
      <SaveCurrentForm
        schema={actesAdministratifsAutoSaveSchema}
        onSave={(data) =>
          handleSave({
            transformationId: transformation.id,
            structureTransformation: buildStructureTransformation(data),
          })
        }
      />

      <ActesAdministratifs categoryDisplayRules={categoryDisplayRules} />
    </FormWrapper>
  );
};
