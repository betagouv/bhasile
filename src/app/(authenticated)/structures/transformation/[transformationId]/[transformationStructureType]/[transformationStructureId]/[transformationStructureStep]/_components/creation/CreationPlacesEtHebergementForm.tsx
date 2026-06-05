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
  StructureVersionTransformationApiRead,
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
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const CreationPlacesEtHebergementForm = ({
  transformation,
  structureVersionTransformation,
}: Props) => {
  const { handleValidation } = useTransformationFormHandling();

  const defaultValues =
    getTransformationStructureVersionDefaultValues<CreationPlacesEtHebergementFormValues>(
      structureVersionTransformation.structureVersion
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
          structureVersionTransformation: {
            id: structureVersionTransformation.id,
            type: structureVersionTransformation.type,
            structureVersion: {
              id: structureVersionTransformation.structureVersion?.id,
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
