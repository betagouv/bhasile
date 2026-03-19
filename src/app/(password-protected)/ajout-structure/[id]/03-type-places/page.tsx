"use client";
import Stepper from "@codegouvfr/react-dsfr/Stepper";

import { useRedirectStructureCreation } from "@/app/hooks/useRedirectStructureCreation";

import FormTypePlaces from "../../_components/forms/FormTypePlaces";

export default function StepTypePlaces() {
  useRedirectStructureCreation();

  return (
    <>
      <Stepper
        currentStep={3}
        nextTitle="Documents financiers"
        stepCount={4}
        title="Types de places"
      />

      <FormTypePlaces />
    </>
  );
}
