"use client";

import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { FieldSetTypeBati } from "@/app/components/forms/hebergement/FieldSetTypeBati";
import { FieldSetTransformationPlaces } from "@/app/components/forms/typePlace/FieldSetTransformationPlaces";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import {
  buildTransformationTypologie,
  getTransformationStructureVersionDefaultValues,
} from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  CreationPlacesEtHebergementFormValues,
  creationPlacesEtHebergementSchema,
} from "@/schemas/forms/transformation/creationPlacesEtHebergement.schema";
import { DeepPartial, FormKind } from "@/types/global";

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
  const { handleValidation } = useTransformationFormHandling();

  const defaultValues: DeepPartial<CreationPlacesEtHebergementFormValues> = {
    ...getTransformationStructureVersionDefaultValues<CreationPlacesEtHebergementFormValues>(
      structureVersionTransformation.structureVersion
    ),
    structureTypologies: [
      buildTransformationTypologie(
        structureVersionTransformation.structureVersion
      ),
    ],
  };

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
      <FieldSetTransformationPlaces
        formKind={formKind}
        originalPlaces={originalPlaces}
      />

      <hr />

      <FieldSetTypeBati formKind={formKind} />

      <FieldSetHebergement formKind={formKind} />
    </FormWrapper>
  );
};
