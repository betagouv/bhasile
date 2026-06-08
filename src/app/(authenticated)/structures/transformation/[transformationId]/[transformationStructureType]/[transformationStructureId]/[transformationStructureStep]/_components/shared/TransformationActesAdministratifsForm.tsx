"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SaveCurrentForm } from "@/app/components/forms/SaveCurrentForm";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import {
  getActesAdministratifsDefaultValues,
  resolveAvenantParentIds,
} from "@/app/utils/acteAdministratif.util";
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
  const { handleValidation, handleSave, prevStep } =
    useTransformationFormHandling();

  const effectiveDate =
    structureVersionTransformation.structureVersion?.effectiveDate;
  const referenceDate = effectiveDate ? new Date(effectiveDate) : new Date();

  const categoryDisplayRules = resolveAvenantParentIds(
    getTransformationActesAdministratifsCategoryToDisplay(
      structureVersionTransformation.type,
      transformation.type
    ),
    structureVersionTransformation.structureVersion?.structure
      ?.actesAdministratifs,
    referenceDate
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
    form: structureVersionTransformation.form,
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
          structureVersionTransformation:
            buildStructureVersionTransformation(data),
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
            structureVersionTransformation:
              buildStructureVersionTransformation(data),
          })
        }
      />

      <ActesAdministratifs categoryDisplayRules={categoryDisplayRules} />
    </FormWrapper>
  );
};
