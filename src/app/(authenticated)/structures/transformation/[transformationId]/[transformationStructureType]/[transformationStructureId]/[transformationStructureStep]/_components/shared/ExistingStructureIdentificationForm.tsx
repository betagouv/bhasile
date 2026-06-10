"use client";

import { TransformationAdresseAdministrative } from "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAdresseAdministrative";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import { EffectiveDateInput } from "@/app/components/forms/EffectiveDateInput";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { TransformationFormController } from "@/app/components/forms/TransformationFormController";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import {
  getAdresseSource,
  getTransformationNounAvecArticle,
  getTransformationStructureVersionDefaultValues,
} from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  TransformationIdentificationDraftFormValues,
  transformationIdentificationDraftSchema,
  transformationIdentificationSchema,
} from "@/schemas/forms/transformation/transformationIdentification.schema";
import { FormKind } from "@/types/global";

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
  formKind: FormKind;
};

export const ExistingStructureIdentificationForm = ({
  transformation,
  structureVersionTransformation,
  formKind,
}: Props) => {
  const { goToNextStep, handleSave, shouldShowIncompleteSteps } =
    useTransformationFormHandling();

  const defaultValues = {
    ...getTransformationStructureVersionDefaultValues<TransformationIdentificationDraftFormValues>(
      structureVersionTransformation.structureVersion
    ),
    isMultiAntenne:
      (structureVersionTransformation.structureVersion?.antennes?.length ?? 0) >
      0,
  };

  const buildStructureVersionTransformation = (
    data: TransformationIdentificationDraftFormValues
  ): StructureVersionTransformationApiUpdateClient => {
    const { effectiveDate, ...rest } = data;
    return {
      id: structureVersionTransformation.id,
      type: structureVersionTransformation.type,
      structureVersion: {
        ...rest,
        dnaStructures: rest.dnaStructures?.filter(
          (dnaStructure) => dnaStructure.dna?.code
        ),
        effectiveDate,
      } as StructureVersionTransformationApiUpdateClient["structureVersion"],
    };
  };

  return (
    <FormWrapper
      schema={
        shouldShowIncompleteSteps
          ? transformationIdentificationSchema
          : transformationIdentificationDraftSchema
      }
      defaultValues={defaultValues}
      onSubmit={goToNextStep}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      showContactInfos={false}
    >
      <TransformationFormController
        schema={transformationIdentificationDraftSchema}
        onSave={(data, values) =>
          handleSave({
            transformationId: transformation.id,
            structureVersionTransformation:
              buildStructureVersionTransformation(data),
            strictSchema: transformationIdentificationSchema,
            values,
          })
        }
      />

      <EffectiveDateInput
        label={`Date de ${getTransformationNounAvecArticle(formKind)}`}
      />

      <hr />

      <TransformationAdresseAdministrative
        formKind={formKind}
        originalAdresse={getAdresseSource(structureVersionTransformation)}
      />

      <hr />

      <DnaAndFiness
        formKind={formKind}
        entityId={{
          structureVersionId:
            structureVersionTransformation.structureVersion?.id,
        }}
      />

      <hr />

      <FieldSetContacts formKind={formKind} />
    </FormWrapper>
  );
};
