"use client";

import { notFound, useParams } from "next/navigation";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getActesAdministratifsDefaultValues } from "@/app/utils/acteAdministratif.util";
import { creationExNihiloActesAdministratifsCategoryToDisplay } from "@/config/transformation.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { creationActesAdministratifsSchema } from "@/schemas/forms/transformation/creationActesAdministratifs.schema";

type Props = {
  transformation: TransformationApiRead;
};

export const CreationExNihiloActesAdministratifsForm = ({
  transformation,
}: Props) => {
  const { transformationStructureId } = useParams();
  const structureTransformation = transformation.structureTransformations.find(
    (structureTransformation) =>
      structureTransformation.id === Number(transformationStructureId)
  );

  if (!structureTransformation) {
    notFound();
  }

  const { handleValidation, prevStep } = useTransformationFormHandling();

  const categoryDisplayRules =
    creationExNihiloActesAdministratifsCategoryToDisplay;

  const defaultValues = {
    actesAdministratifs: getActesAdministratifsDefaultValues(
      structureTransformation.actesAdministratifs,
      categoryDisplayRules
    ),
  };

  return (
    <FormWrapper
      schema={creationActesAdministratifsSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureTransformation: {
            id: structureTransformation.id,
            type: structureTransformation.type,
            actesAdministratifs:
              data.actesAdministratifs as ActeAdministratifApiType[],
          },
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      previousStep={prevStep?.route}
      showContactInfos={false}
    >
      <ActesAdministratifs categoryDisplayRules={categoryDisplayRules} />
    </FormWrapper>
  );
};
