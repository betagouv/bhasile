"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getActesAdministratifsDefaultValues } from "@/app/utils/acteAdministratif.util";
import { getCreationActesAdministratifsCategoryToDisplay } from "@/config/transformation.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { actesAdministratifsCreationSchema } from "@/schemas/forms/base/acteAdministratif.schema";

type Props = {
  structureTransformation: StructureTransformationApiRead;
  transformation: TransformationApiRead;
};

export const CreationActesAdministratifsForm = ({
  structureTransformation,
  transformation,
}: Props) => {
  const { handleValidation, prevStep } = useTransformationFormHandling();

  const categoryDisplayRules = getCreationActesAdministratifsCategoryToDisplay(
    transformation.type
  );

  const defaultValues = {
    actesAdministratifs: getActesAdministratifsDefaultValues(
      structureTransformation.actesAdministratifs,
      categoryDisplayRules
    ),
  };

  return (
    <FormWrapper
      schema={actesAdministratifsCreationSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureTransformation: {
            id: structureTransformation.id,
            type: structureTransformation.type,
            actesAdministratifs:
              data.actesAdministratifs as ActeAdministratifApiType[],
          },
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      previousStep={prevStep?.route}
      showContactInfos={false}
    >
      <ActesAdministratifs categoryDisplayRules={categoryDisplayRules} />
    </FormWrapper>
  );
};
