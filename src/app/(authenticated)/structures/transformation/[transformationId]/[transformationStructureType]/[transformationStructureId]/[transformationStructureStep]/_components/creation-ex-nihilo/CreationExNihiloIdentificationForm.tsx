"use client";

import { useParams } from "next/navigation";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { FieldSetDescription } from "@/app/components/forms/description/FieldSetDescription";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getStructureTransformationDefaultValues } from "@/app/utils/transformation.util";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  CreationIdentificationFormValues,
  creationIdentificationSchema,
} from "@/schemas/forms/transformation/creationIdentification.schema";
import { FormKind } from "@/types/global";

type Props = {
  transformation: TransformationApiRead;
};

export const CreationExNihiloIdentificationForm = ({
  transformation,
}: Props) => {
  const { transformationStructureId } = useParams();
  const structureTransformation = transformation.structureTransformations.find(
    (st) => st.id === Number(transformationStructureId)
  )!;

  const { handleValidation } = useTransformationFormHandling();

  const defaultValues =
    getStructureTransformationDefaultValues<CreationIdentificationFormValues>(
      structureTransformation
    );

  return (
    <FormWrapper
      schema={creationIdentificationSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        const { creationDate, ...rest } = data;
        handleValidation({
          transformationId: transformation.id,
          structureTransformation: {
            id: structureTransformation.id,
            type: structureTransformation.type,
            date: creationDate,
            structureVersion: { ...rest },
          },
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      showContactInfos={false}
    >
      <FieldSetDescription formKind={FormKind.CREATION_EX_NIHILO} />

      <hr />

      <AdresseAdministrativeAndAntennes />

      <hr />

      <DnaAndFiness />

      <hr />

      <FieldSetContacts />
    </FormWrapper>
  );
};
