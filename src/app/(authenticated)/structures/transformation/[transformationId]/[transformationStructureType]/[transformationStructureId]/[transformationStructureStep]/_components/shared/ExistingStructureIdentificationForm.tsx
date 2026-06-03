"use client";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import { EffectiveDateInput } from "@/app/components/forms/EffectiveDateInput";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SaveCurrentForm } from "@/app/components/forms/SaveCurrentForm";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import {
  getTransformationNounAvecArticle,
  getTransformationStructureVersionDefaultValues,
} from "@/app/utils/transformation.util";
import {
  StructureTransformationApiRead,
  StructureTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  TransformationIdentificationDraftFormValues,
  transformationIdentificationDraftSchema,
  TransformationIdentificationFormValues,
  transformationIdentificationSchema,
} from "@/schemas/forms/transformation/transformationIdentification.schema";
import { FormKind } from "@/types/global";

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
  formKind: FormKind;
};

export const ExistingStructureIdentificationForm = ({
  transformation,
  structureTransformation,
  formKind,
}: Props) => {
  const { handleValidation, handleSave } = useTransformationFormHandling();

  const defaultValues = {
    ...getTransformationStructureVersionDefaultValues<TransformationIdentificationFormValues>(
      structureTransformation.structureVersion
    ),
    isMultiAntenne:
      (structureTransformation.structureVersion?.antennes?.length ?? 0) > 0,
  };

  const buildStructureTransformation = (
    data: TransformationIdentificationDraftFormValues
  ): StructureTransformationApiUpdateClient => {
    const { effectiveDate, ...rest } = data;
    return {
      id: structureTransformation.id,
      type: structureTransformation.type,
      forms: structureTransformation.forms,
      structureVersion: {
        ...rest,
        dnaStructures: rest.dnaStructures?.filter(
          (dnaStructure) => dnaStructure.dna?.code
        ),
        effectiveDate,
      } as StructureTransformationApiUpdateClient["structureVersion"],
    };
  };

  return (
    <FormWrapper
      schema={transformationIdentificationSchema}
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
        schema={transformationIdentificationDraftSchema}
        onSave={(data) =>
          handleSave({
            transformationId: transformation.id,
            structureTransformation: buildStructureTransformation(data),
          })
        }
      />

      <EffectiveDateInput
        label={`Date de ${getTransformationNounAvecArticle(formKind)}`}
      />

      <hr />

      <AdresseAdministrativeAndAntennes formKind={formKind} />

      <hr />

      <DnaAndFiness
        formKind={formKind}
        entityId={{
          structureVersionId: structureTransformation.structureVersion?.id,
        }}
      />

      <hr />

      <FieldSetContacts formKind={formKind} />
    </FormWrapper>
  );
};
