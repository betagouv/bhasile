"use client";

import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { FieldSetTypeBati } from "@/app/components/forms/hebergement/FieldSetTypeBati";
import { TransformationFormController } from "@/app/components/forms/TransformationFormController";
import { CurrentYearPlaces } from "@/app/components/forms/typePlace/CurrentYearPlaces";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getTransformationDefaultValues } from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  CreationPlacesEtHebergementDraftFormValues,
  creationPlacesEtHebergementDraftSchema,
  getPlacesEtHebergementSchema,
} from "@/schemas/forms/transformation/creationPlacesEtHebergement.schema";
import { FormKind } from "@/types/global";

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
  formKind: FormKind;
  originalPlaces?: number;
};

export const PlacesEtHebergementForm = ({
  transformation,
  structureVersionTransformation,
  formKind,
  originalPlaces,
}: Props) => {
  const {
    goToNextStep,
    navigateWithSave,
    handleSave,
    backLink,
    shouldShowIncompleteSteps,
  } = useTransformationFormHandling();

  const strictSchema = getPlacesEtHebergementSchema(formKind, originalPlaces);

  const defaultValues =
    getTransformationDefaultValues<CreationPlacesEtHebergementDraftFormValues>({
      transformation,
      structureVersionTransformation,
    });

  const buildStructureVersionTransformation = (
    data: CreationPlacesEtHebergementDraftFormValues
  ): StructureVersionTransformationApiUpdateClient => ({
    id: structureVersionTransformation.id,
    type: structureVersionTransformation.type,
    structureVersion: {
      id: structureVersionTransformation.structureVersion?.id,
      public: data.public,
      adresses: data.adresses,
      structureTypologies: data.structureTypologies,
    } as StructureVersionTransformationApiUpdateClient["structureVersion"],
  });

  return (
    <FormWrapper
      schema={
        shouldShowIncompleteSteps
          ? strictSchema
          : creationPlacesEtHebergementDraftSchema
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
        schema={creationPlacesEtHebergementDraftSchema}
        onSave={(data, values) =>
          handleSave({
            transformationId: transformation.id,
            structureVersionTransformation:
              buildStructureVersionTransformation(data),
            strictSchema,
            values,
          })
        }
      />

      <CurrentYearPlaces formKind={formKind} originalPlaces={originalPlaces} />

      <hr />

      <FieldSetTypeBati formKind={formKind} />

      <FieldSetHebergement formKind={formKind} />
    </FormWrapper>
  );
};
