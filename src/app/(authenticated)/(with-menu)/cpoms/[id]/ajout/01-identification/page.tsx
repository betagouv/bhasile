"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";

import { FieldSetActesAdministratifs } from "@/app/components/forms/cpom/FieldSetActesAdministratifs";
import { FieldSetGeneral } from "@/app/components/forms/cpom/FieldSetGeneral";
import { FieldSetStructures } from "@/app/components/forms/cpom/FieldSetStructures";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { PreviousPageLink } from "@/app/components/forms/PreviousPageLink";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import {
  getCpomDefaultValues,
  getCpomStructureTypes,
} from "@/app/utils/cpom.util";
import { cpomSchema } from "@/schemas/forms/base/cpom.schema";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomAjoutIdentification() {
  const { cpom } = useCpomContext();

  const { handleSubmit } = useCpomFormHandling({
    cpomId: cpom.id,
    nextRoute: `/cpoms/${cpom.id}/ajout/02-finances`,
  });

  const defaultValues = getCpomDefaultValues(cpom);
  const structureTypes = getCpomStructureTypes(cpom);

  return (
    <>
      <Stepper
        currentStep={1}
        nextTitle="Analyse financière"
        stepCount={2}
        title="Identification du CPOM"
        className="w-1/2"
      />
      <FormWrapper
        schema={cpomSchema}
        defaultValues={defaultValues}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <PreviousPageLink previousRoute="" />

        <FieldSetGeneral />
        <FieldSetActesAdministratifs structureTypes={structureTypes} />
        <FieldSetStructures />
      </FormWrapper>
    </>
  );
}
