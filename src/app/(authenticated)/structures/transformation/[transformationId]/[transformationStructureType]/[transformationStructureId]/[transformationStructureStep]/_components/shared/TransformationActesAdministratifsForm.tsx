"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { TransformationFormController } from "@/app/components/forms/TransformationFormController";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getActesAdministratifsDefaultValues } from "@/app/utils/acteAdministratif.util";
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
  const { goToNextStep, handleSave, prevStep, shouldShowIncompleteSteps } =
    useTransformationFormHandling();

  const categoryDisplayRules =
    getTransformationActesAdministratifsCategoryToDisplay(
      structureVersionTransformation.type,
      transformation.type
    );

  const defaultValues = {
    actesAdministratifs: getActesAdministratifsDefaultValues(
      structureVersionTransformation.actesAdministratifs,
      categoryDisplayRules
    ),
  };

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
      key={shouldShowIncompleteSteps ? "strict" : "draft"}
      schema={
        shouldShowIncompleteSteps
          ? actesAdministratifsTransformationSchema
          : actesAdministratifsAutoSaveSchema
      }
      defaultValues={defaultValues}
      onSubmit={goToNextStep}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      previousStep={prevStep?.route}
      showContactInfos={false}
    >
      <TransformationFormController
        schema={actesAdministratifsAutoSaveSchema}
        onSave={(data, values) =>
          handleSave({
            transformationId: transformation.id,
            structureVersionTransformation:
              buildStructureVersionTransformation(data),
            strictSchema: actesAdministratifsTransformationSchema,
            values,
          })
        }
      />

      <ActesAdministratifs categoryDisplayRules={categoryDisplayRules} />
    </FormWrapper>
  );
};
