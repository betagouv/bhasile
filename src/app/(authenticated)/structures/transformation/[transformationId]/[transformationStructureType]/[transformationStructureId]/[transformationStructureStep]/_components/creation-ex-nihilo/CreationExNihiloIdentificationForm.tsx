"use client";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { FieldSetDescription } from "@/app/components/forms/description/FieldSetDescription";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SaveCurrentForm } from "@/app/components/forms/SaveCurrentForm";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getTransformationStructureVersionDefaultValues } from "@/app/utils/transformation.util";
import {
  StructureTransformationApiRead,
  StructureTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  CreationIdentificationDraftFormValues,
  creationIdentificationDraftSchema,
  CreationIdentificationFormValues,
  creationIdentificationSchema,
} from "@/schemas/forms/transformation/creationIdentification.schema";
import { FormKind } from "@/types/global";

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
};

export const CreationExNihiloIdentificationForm = ({
  transformation,
  structureTransformation,
}: Props) => {
  const { handleValidation, handleSave } = useTransformationFormHandling();

  const defaultValues = {
    ...getTransformationStructureVersionDefaultValues<CreationIdentificationFormValues>(
      structureTransformation.structureVersion
    ),
    operateur: structureTransformation.operateur,
  };

  const buildStructureTransformation = (
    data: CreationIdentificationDraftFormValues
  ): StructureTransformationApiUpdateClient => {
    const { creationDate, operateur, ...rest } = data;
    return {
      id: structureTransformation.id,
      type: structureTransformation.type,
      forms: structureTransformation.forms,
      operateurId: operateur?.id,
      structureVersion: {
        ...rest,
        dnaStructures: rest.dnaStructures?.filter(
          (dnaStructure) => dnaStructure.dna?.code
        ),
        creationDate,
        effectiveDate: creationDate,
      } as StructureTransformationApiUpdateClient["structureVersion"],
    };
  };

  return (
    <FormWrapper
      schema={creationIdentificationSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureTransformation: buildStructureTransformation(data),
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      showContactInfos={false}
    >
      <SaveCurrentForm
        schema={creationIdentificationDraftSchema}
        onSave={(data) =>
          handleSave({
            transformationId: transformation.id,
            structureTransformation: buildStructureTransformation(data),
          })
        }
      />

      <FieldSetDescription formKind={FormKind.CREATION_EX_NIHILO} />

      <hr />

      <AdresseAdministrativeAndAntennes />

      <hr />

      <DnaAndFiness
        entityId={{
          structureVersionId: structureTransformation.structureVersion?.id,
        }}
      />

      <hr />

      <FieldSetContacts />
    </FormWrapper>
  );
};
