"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";

import FormWrapper from "@/app/components/forms/FormWrapper";

export default function CpomAjoutIdentification() {
  return (
    <>
      <Stepper
        currentStep={1}
        nextTitle="Analyse financière"
        stepCount={4}
        title="Identification du cpom"
      />
      <FormWrapper
        schema={cpomAjoutIdentificationSchema}
        defaultValues={defaultValues}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
      ></FormWrapper>
    </>
  );
}
