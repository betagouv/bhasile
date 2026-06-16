"use client";

import { TransformationAdresseAdministrative } from "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAdresseAdministrative";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { TransformationDnaAndFiness } from "@/app/components/forms/dnaAndFiness/TransformationDnaAndFiness";
import { EffectiveDateInput } from "@/app/components/forms/EffectiveDateInput";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SaveCurrentForm } from "@/app/components/forms/SaveCurrentForm";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import {
  getAdresseSource,
  getInitialAntennes,
  getTransformationDefaultValues,
  getTransformationNounAvecArticle,
} from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
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
  structureVersionTransformation: StructureVersionTransformationApiRead;
  formKind: FormKind;
};

export const ExistingStructureIdentificationForm = ({
  transformation,
  structureVersionTransformation,
  formKind,
}: Props) => {
  const { handleValidation, handleSave, backLink } =
    useTransformationFormHandling();

  const defaultValues =
    getTransformationDefaultValues<TransformationIdentificationFormValues>({
      transformation,
      structureVersionTransformation,
    });

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
      schema={transformationIdentificationSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureVersionTransformation: buildStructureVersionTransformation(data),
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      backLink={backLink}
      showContactInfos={false}
    >
      <SaveCurrentForm
        schema={transformationIdentificationDraftSchema}
        onSave={(data) =>
          handleSave({
            transformationId: transformation.id,
            structureVersionTransformation: buildStructureVersionTransformation(data),
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
        originalAntennes={getInitialAntennes(
          transformation,
          structureVersionTransformation
        )}
      />

      <hr />

      <TransformationDnaAndFiness
        entityId={{
          structureVersionId: structureVersionTransformation.structureVersion?.id,
        }}
      />

      <hr />

      <FieldSetContacts formKind={formKind} />
    </FormWrapper>
  );
};
