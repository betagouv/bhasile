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
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
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
  structureVersionTransformation: StructureVersionTransformationApiRead;
  formKind: FormKind;
};

export const CreationIdentificationForm = ({
  transformation,
  structureVersionTransformation,
  formKind,
}: Props) => {
  const { handleValidation, handleSave } = useTransformationFormHandling();

  const defaultValues = {
    ...getTransformationStructureVersionDefaultValues<CreationIdentificationFormValues>(
      structureVersionTransformation.structureVersion
    ),
    // TODO: move those server-side once every PR is merged
    operateur: structureVersionTransformation.operateur,
    isMultiAntenne:
      (structureVersionTransformation.structureVersion?.antennes?.length ?? 0) > 0,
  };

  const buildStructureVersionTransformation = (
    data: CreationIdentificationDraftFormValues
  ): StructureVersionTransformationApiUpdateClient => {
    const { creationDate, operateur, ...rest } = data;
    return {
      id: structureVersionTransformation.id,
      type: structureVersionTransformation.type,
      form: structureVersionTransformation.form,
      operateurId: operateur?.id,
      structureVersion: {
        ...rest,
        dnaStructures: rest.dnaStructures?.filter(
          (dnaStructure) => dnaStructure.dna?.code
        ),
        creationDate,
        effectiveDate: creationDate,
      } as StructureVersionTransformationApiUpdateClient["structureVersion"],
    };
  };

  return (
    <FormWrapper
      schema={creationIdentificationSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureVersionTransformation: buildStructureVersionTransformation(data),
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
            structureVersionTransformation: buildStructureVersionTransformation(data),
          })
        }
      />

      <FieldSetDescription formKind={formKind} />

      <hr />

      <AdresseAdministrativeAndAntennes formKind={formKind} />

      <hr />

      <DnaAndFiness
        formKind={formKind}
        entityId={{
          structureVersionId: structureVersionTransformation.structureVersion?.id,
        }}
      />

      <hr />

      <FieldSetContacts formKind={formKind} />
    </FormWrapper>
  );
};
