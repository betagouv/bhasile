"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SaveCurrentForm } from "@/app/components/forms/SaveCurrentForm";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getTransformationDefaultValues } from "@/app/utils/transformation.util";
import { getTransformationActesAdministratifsCategoryToDisplay } from "@/config/transformation.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  ActesAdministratifsAutoSaveFormValues,
  actesAdministratifsAutoSaveSchema,
  ActesAdministratifsTransformationFormValues,
  actesAdministratifsTransformationSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";

type Props = {
  structureVersionTransformation: StructureVersionTransformationApiRead;
  transformation: TransformationApiRead;
};

export const TransformationActesAdministratifsForm = ({
  structureVersionTransformation,
  transformation,
}: Props) => {
  const { handleValidation, handleSave, prevStep } =
    useTransformationFormHandling();

  const categoryDisplayRules =
    getTransformationActesAdministratifsCategoryToDisplay(
      structureVersionTransformation.type,
      transformation.type
    );

  const defaultValues =
    getTransformationDefaultValues<ActesAdministratifsTransformationFormValues>({
      transformation,
      structureVersionTransformation,
    });

  const buildStructureVersionTransformation = (
    data: ActesAdministratifsAutoSaveFormValues
  ): StructureVersionTransformationApiUpdateClient => ({
    id: structureVersionTransformation.id,
    type: structureVersionTransformation.type,
    actesAdministratifs: (data.actesAdministratifs ??
      []) as ActeAdministratifApiType[],
  });

  return (
    <FormWrapper
      schema={actesAdministratifsTransformationSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureVersionTransformation: buildStructureVersionTransformation(data),
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
            structureVersionTransformation: buildStructureVersionTransformation(data),
          })
        }
      />

      <ActesAdministratifs categoryDisplayRules={categoryDisplayRules} />
    </FormWrapper>
  );
};
