"use client";

import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { FieldSetTypeBati } from "@/app/components/forms/hebergement/FieldSetTypeBati";
import { FieldSetCurrentYearPlaces } from "@/app/components/forms/typePlace/FieldSetCurrentYearPlaces";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getTransformationStructureVersionDefaultValues } from "@/app/utils/transformation.util";
import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  CreationPlacesEtHebergementFormValues,
  creationPlacesEtHebergementSchema,
} from "@/schemas/forms/transformation/creationPlacesEtHebergement.schema";
import { FormKind } from "@/types/global";
import { TransformationType } from "@/types/transformation.type";

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
};

export const CreationPlacesEtHebergementForm = ({
  transformation,
  structureTransformation,
}: Props) => {
  const { handleValidation } = useTransformationFormHandling();

  const defaultValues =
    getTransformationStructureVersionDefaultValues<CreationPlacesEtHebergementFormValues>(
      structureTransformation.structureVersion
    );

  const formKind =
    transformation.type === TransformationType.OUVERTURE_EX_NIHILO
      ? FormKind.OUVERTURE_EX_NIHILO
      : FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES;

  return (
    <FormWrapper
      schema={creationPlacesEtHebergementSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureTransformation: {
            id: structureTransformation.id,
            type: structureTransformation.type,
            structureVersion: {
              id: structureTransformation.structureVersion?.id,
              public: data.public,
              adresses: data.adresses,
              structureTypologies: data.structureTypologies,
            },
          },
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      showContactInfos={false}
    >
      <FieldSetCurrentYearPlaces />

      <hr />

      <FieldSetTypeBati formKind={formKind} />

      <FieldSetHebergement formKind={formKind} />
    </FormWrapper>
  );
};
