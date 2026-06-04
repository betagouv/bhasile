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

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
  formKind: FormKind;
  originalPlaces?: number;
};

export const PlacesEtHebergementForm = ({
  transformation,
  structureTransformation,
  formKind,
  originalPlaces,
}: Props) => {
  const { handleValidation } = useTransformationFormHandling();

  const defaultValues =
    getTransformationStructureVersionDefaultValues<CreationPlacesEtHebergementFormValues>(
      structureTransformation.structureVersion
    );

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
      <FieldSetCurrentYearPlaces
        formKind={formKind}
        originalPlaces={originalPlaces}
      />

      <hr />

      <FieldSetTypeBati formKind={formKind} />

      <FieldSetHebergement formKind={formKind} />
    </FormWrapper>
  );
};
