"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";

import { FieldSetGeneral } from "@/app/components/forms/fieldsets/cpom/FieldSetGeneral";
import { FieldSetStructures } from "@/app/components/forms/fieldsets/cpom/FieldSetStructures";
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

  if (!cpom) {
    return null;
  }
  return (
    <>
      <Stepper
        currentStep={1}
        nextTitle="Analyse financière"
        stepCount={4}
        title="Identification du cpom"
      />
      <FormWrapper
        schema={cpomIdentificationSchema}
        defaultValues={cpom}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
      >
        <FieldSetGeneral />
        <FieldSetStructures />
      </FormWrapper>
    </>
  );
}
