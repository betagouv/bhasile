"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import { EffectiveDateInput } from "@/app/components/forms/EffectiveDateInput";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { TransformationFormController } from "@/app/components/forms/TransformationFormController";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getTransformationDefaultValues } from "@/app/utils/transformation.util";
import { fermetureActesAdministratifsCategoryToDisplay } from "@/config/transformation.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  FermetureDraftFormValues,
  fermetureDraftSchema,
  fermetureSchema,
} from "@/schemas/forms/transformation/fermeture.schema";

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const FermetureDescriptionForm = ({
  transformation,
  structureVersionTransformation,
}: Props) => {
  const {
    goToNextStep,
    navigateWithSave,
    handleSave,
    backLink,
    shouldShowIncompleteSteps,
  } = useTransformationFormHandling();

  const categoryDisplayRules = fermetureActesAdministratifsCategoryToDisplay;
  const codeBhasile =
    structureVersionTransformation.structureVersion?.structure?.codeBhasile;

  const defaultValues =
    getTransformationDefaultValues<FermetureDraftFormValues>({
      transformation,
      structureVersionTransformation,
    });

  const buildStructureVersionTransformation = (
    data: FermetureDraftFormValues
  ): StructureVersionTransformationApiUpdateClient => ({
    id: structureVersionTransformation.id,
    type: structureVersionTransformation.type,
    structureVersion: {
      id: structureVersionTransformation.structureVersion?.id,
      structureId: structureVersionTransformation.structureVersion?.structureId,
      effectiveDate: data.effectiveDate,
    },
    actesAdministratifs: data.actesAdministratifs as ActeAdministratifApiType[],
  });

  return (
    <FormWrapper
      schema={
        shouldShowIncompleteSteps ? fermetureSchema : fermetureDraftSchema
      }
      defaultValues={defaultValues}
      onSubmit={goToNextStep}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      backLink={backLink}
      onBackNavigate={navigateWithSave}
      showContactInfos={false}
    >
      <TransformationFormController
        schema={fermetureDraftSchema}
        onSave={(data, values) =>
          handleSave({
            transformationId: transformation.id,
            structureVersionTransformation:
              buildStructureVersionTransformation(data),
            strictSchema: fermetureSchema,
            values,
          })
        }
      />

      <EffectiveDateInput
        label="Date de la fermeture"
        hintText={codeBhasile ? `de la structure ${codeBhasile}` : undefined}
      />
      <hr />
      <ActesAdministratifs categoryDisplayRules={categoryDisplayRules} />
    </FormWrapper>
  );
};
