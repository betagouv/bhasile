"use client";
import Stepper from "@codegouvfr/react-dsfr/Stepper";

import { useRedirectStructureCreation } from "@/app/hooks/useRedirectStructureCreation";

import FormAdresses from "../../_components/forms/FormAdresses";

export default function StepAdresses() {
  useRedirectStructureCreation();

  return (
    <>
      <Stepper
        currentStep={2}
        nextTitle="Types de places"
        stepCount={4}
        title="Adresses"
      />

      <FormAdresses />
    </>
  );
}
