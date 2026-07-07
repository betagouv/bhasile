"use client";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { FieldSetDescription } from "@/app/components/forms/description/FieldSetDescription";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import { TransformationDnaAndFiness } from "@/app/components/forms/dnaAndFiness/TransformationDnaAndFiness";
import { EffectiveDateInput } from "@/app/components/forms/EffectiveDateInput";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { TransformationFormController } from "@/app/components/forms/TransformationFormController";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getTransformationDefaultValues } from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  CreationIdentificationDraftFormValues,
  creationIdentificationDraftSchema,
  creationIdentificationSchema,
} from "@/schemas/forms/transformation/creationIdentification.schema";
import { FormKind } from "@/types/global";

export const CreationIdentificationForm = ({
  transformation,
  structureVersionTransformation,
  formKind,
}: Props) => {
  const {
    goToNextStep,
    navigateWithSave,
    handleSave,
    backLink,
    shouldShowIncompleteSteps,
  } = useTransformationFormHandling();

  const defaultValues =
    getTransformationDefaultValues<CreationIdentificationDraftFormValues>({
      transformation,
      structureVersionTransformation,
    });

  const buildStructureVersionTransformation = (
    data: CreationIdentificationDraftFormValues
  ): StructureVersionTransformationApiUpdateClient => {
    const { effectiveDate, operateur, type, ...rest } = data;
    return {
      id: structureVersionTransformation.id,
      type: structureVersionTransformation.type,
      operateurId: operateur?.id,
      structureType: type,
      structureVersion: {
        ...rest,
        dnaStructures: rest.dnaStructures?.filter(
          (dnaStructure) => dnaStructure.dna?.code
        ),
        structureFinesses: rest.structureFinesses?.filter(
          (structureFiness) => structureFiness.finess?.code
        ),
        effectiveDate,
      } as StructureVersionTransformationApiUpdateClient["structureVersion"],
    };
  };

  return (
    <FormWrapper
      schema={
        shouldShowIncompleteSteps
          ? creationIdentificationSchema
          : creationIdentificationDraftSchema
      }
      defaultValues={defaultValues}
      onSubmit={goToNextStep}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      backLink={backLink}
      onBackNavigate={navigateWithSave}
      showContactInfos={false}
    >
      <TransformationFormController
        schema={creationIdentificationDraftSchema}
        onSave={(data, values) =>
          handleSave({
            transformationId: transformation.id,
            structureVersionTransformation:
              buildStructureVersionTransformation(data),
            strictSchema: creationIdentificationSchema,
            values,
          })
        }
      />
      <EffectiveDateInput label="Date d’ouverture" />
      <hr />
      <FieldSetDescription formKind={formKind} />
      <hr />
      <AdresseAdministrativeAndAntennes formKind={formKind} />
      <hr />
      {formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES ? (
        <TransformationDnaAndFiness
          entityId={{
            structureVersionId:
              structureVersionTransformation.structureVersion?.id,
          }}
        />
      ) : (
        <DnaAndFiness
          formKind={formKind}
          entityId={{
            structureVersionId:
              structureVersionTransformation.structureVersion?.id,
          }}
        />
      )}
      <hr />
      <FieldSetContacts formKind={formKind} />
    </FormWrapper>
  );
};

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
  formKind: FormKind;
};
