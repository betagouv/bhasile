"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";

import { FieldSetFinances } from "@/app/components/forms/fieldsets/cpom/FieldSetFinances";
import FormWrapper from "@/app/components/forms/FormWrapper";
import {
  CpomIdentificationFormValues,
  cpomIdentificationSchema,
} from "@/schemas/forms/cpom/cpomIdentification.schema";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationIdentification() {
  const { cpom } = useCpomContext();

  const handleSubmit = (data: CpomIdentificationFormValues) => {
    console.log(data);
  };
  console.log(cpom);
  if (!cpom) {
    return null;
  }
  return (
    <>
      <Stepper
        currentStep={2}
        nextTitle=""
        stepCount={2}
        title="Analyse financière"
      />
      <FormWrapper
        schema={cpomIdentificationSchema}
        defaultValues={cpom}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
      >
        <FieldSetFinances />
      </FormWrapper>
    </>
  );
}
