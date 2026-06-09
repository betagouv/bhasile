"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import { EffectiveDateInput } from "@/app/components/forms/EffectiveDateInput";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getActesAdministratifsDefaultValues } from "@/app/utils/acteAdministratif.util";
import { fermetureActesAdministratifsCategoryToDisplay } from "@/config/transformation.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { fermetureSchema } from "@/schemas/forms/transformation/fermeture.schema";

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const FermetureDescriptionForm = ({
  transformation,
  structureVersionTransformation,
}: Props) => {
  const { handleValidation, prevStep } = useTransformationFormHandling();

  const categoryDisplayRules = fermetureActesAdministratifsCategoryToDisplay;
  const codeBhasile =
    structureVersionTransformation.structureVersion?.structure?.codeBhasile;

  const defaultValues = {
    effectiveDate: structureVersionTransformation.structureVersion?.effectiveDate,
    actesAdministratifs: getActesAdministratifsDefaultValues(
      structureVersionTransformation.actesAdministratifs,
      categoryDisplayRules
    ),
  };

  return (
    <FormWrapper
      schema={fermetureSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureVersionTransformation: {
            id: structureVersionTransformation.id,
            type: structureVersionTransformation.type,
            structureVersion: {
              id: structureVersionTransformation.structureVersion?.id,
              structureId:
                structureVersionTransformation.structureVersion?.structureId,
              effectiveDate: data.effectiveDate,
            },
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
      <EffectiveDateInput
        label="Date de la fermeture"
        hintText={codeBhasile ? `de la structure ${codeBhasile}` : undefined}
      />
      <ActesAdministratifs categoryDisplayRules={categoryDisplayRules} />
    </FormWrapper>
  );
};
