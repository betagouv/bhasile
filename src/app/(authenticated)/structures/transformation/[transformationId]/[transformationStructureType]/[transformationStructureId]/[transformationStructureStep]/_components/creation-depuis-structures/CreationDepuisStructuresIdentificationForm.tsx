"use client";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { FieldSetDescription } from "@/app/components/forms/description/FieldSetDescription";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getTransformationStructureVersionDefaultValues } from "@/app/utils/transformation.util";
import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  CreationIdentificationFormValues,
  creationIdentificationSchema,
} from "@/schemas/forms/transformation/creationIdentification.schema";
import { FormKind } from "@/types/global";

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
};

export const CreationDepuisStructuresIdentificationForm = ({
  transformation,
  structureTransformation,
}: Props) => {
  const { handleValidation } = useTransformationFormHandling();

  const defaultValues = {
    ...getTransformationStructureVersionDefaultValues<CreationIdentificationFormValues>(
      structureTransformation.structureVersion
    ),
    // TODO: move those server-side once every PR is merged
    operateur: structureTransformation.operateur,
    isMultiAntenne:
      (structureTransformation.structureVersion?.antennes?.length ?? 0) > 0,
  };

  return (
    <FormWrapper
      schema={creationIdentificationSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        const { creationDate, operateur, ...rest } = data;
        handleValidation({
          transformationId: transformation.id,
          structureTransformation: {
            id: structureTransformation.id,
            type: structureTransformation.type,
            operateurId: operateur?.id,
            structureVersion: {
              ...rest,
              creationDate,
              effectiveDate: creationDate,
            },
          },
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      showContactInfos={false}
    >
      <FieldSetDescription formKind={FormKind.CREATION_FROM_STRUCTURE} />

      <hr />

      <AdresseAdministrativeAndAntennes
        formKind={FormKind.CREATION_FROM_STRUCTURE}
      />

      <hr />

      <DnaAndFiness formKind={FormKind.CREATION_FROM_STRUCTURE} />

      <hr />

      <FieldSetContacts formKind={FormKind.CREATION_FROM_STRUCTURE} />
    </FormWrapper>
  );
};
