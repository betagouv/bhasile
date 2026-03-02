"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";

import FormIdentification from "@/app/(password-protected)/ajout-structure/_components/forms/FormIdentification";
import { useRedirectStructureCreation } from "@/app/hooks/useRedirectStructureCreation";

export default function StepInfo() {
  useRedirectStructureCreation();

  return (
    <>
      <Stepper
        currentStep={1}
        nextTitle="Adresses"
        stepCount={4}
        title="Identification de la structure"
      />
      <FormIdentification />
    </>
  );
}
