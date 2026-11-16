"use client";

import { TransformationAdresseAdministrative } from "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAdresseAdministrative";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { TransformationDnaAndFiness } from "@/app/components/forms/dnaAndFiness/TransformationDnaAndFiness";
import { EffectiveDateInput } from "@/app/components/forms/EffectiveDateInput";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { TransformationFormController } from "@/app/components/forms/TransformationFormController";
import { useCanUpdateDepartement } from "@/app/hooks/useCanUpdateStructure";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import {
  getInitialAntennes,
  getTransformationDefaultValues,
  getTransformationNounAvecArticle,
} from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { withDepartementAdministratifInPerimetre } from "@/schemas/forms/base/adresseAdministrative.schema";
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
  const {
    goToNextStep,
    navigateWithSave,
    handleSave,
    backLink,
    shouldShowIncompleteSteps,
  } = useTransformationFormHandling();

  const canUpdateDepartement = useCanUpdateDepartement();
  const strictSchema = withDepartementAdministratifInPerimetre(
    transformationIdentificationSchema,
    canUpdateDepartement
  );
  const draftSchema = withDepartementAdministratifInPerimetre(
    transformationIdentificationDraftSchema,
    canUpdateDepartement
  );

  const defaultValues =
    getTransformationDefaultValues<TransformationIdentificationDraftFormValues>(
      {
        transformation,
        structureVersionTransformation,
      }
    );

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
        structureFinesses: rest.structureFinesses?.filter(
          (structureFiness) => structureFiness.finess?.code
        ),
        effectiveDate,
      } as StructureVersionTransformationApiUpdateClient["structureVersion"],
    };
  };

  return (
    <FormWrapper
      schema={shouldShowIncompleteSteps ? strictSchema : draftSchema}
      defaultValues={defaultValues}
      onSubmit={goToNextStep}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      backLink={backLink}
      onBackNavigate={navigateWithSave}
      showContactInfos={false}
    >
      <TransformationFormController
        schema={draftSchema}
        onSave={(data, values) =>
          handleSave({
            transformationId: transformation.id,
            structureVersionTransformation:
              buildStructureVersionTransformation(data),
            strictSchema,
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
        originalAntennes={getInitialAntennes(
          transformation,
          structureVersionTransformation
        )}
      />

      <hr />

      <TransformationDnaAndFiness
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
