"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";

import { FieldSetFinances } from "@/app/components/forms/fieldsets/cpom/FieldSetFinances";
import FormWrapper from "@/app/components/forms/FormWrapper";
import { useCpom } from "@/app/hooks/useCpom";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { CpomFormValues, cpomSchema } from "@/schemas/forms/base/cpom.schema";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationIdentification() {
  const { cpom } = useCpomContext();

  const { updateCpom } = useCpom();

  const handleSubmit = async (data: CpomFormValues) => {
    console.log(data);
    const result = await updateCpom(data);
    console.log(result);
  };

  const defaultValues = getCpomDefaultValues(cpom);

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
        schema={cpomSchema}
        defaultValues={defaultValues}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
      >
        <FieldSetFinances />
      </FormWrapper>
    </>
  );
}
