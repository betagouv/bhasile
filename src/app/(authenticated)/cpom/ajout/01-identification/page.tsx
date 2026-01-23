"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";

import FormWrapper from "@/app/components/forms/FormWrapper";
import { cpomAjoutIdentificationSchema } from "@/schemas/forms/cpom/cpomAjoutIdentification.schema";
import { CpomGranularity } from "@/types/cpom.type";

import { FieldSetGeneral } from "./_components/FieldSetGeneral";
import { FieldSetStructures } from "./_components/FieldSetStructures";

export default function CpomAjoutIdentification() {
  const defaultValues = {
    name: "",
    structures: [],
    yearStart: undefined,
    yearEnd: undefined,
    operateur: {
      id: undefined,
      name: "",
    },
    granularity: CpomGranularity.DEPARTEMENTALE,
    departement: [],
  };
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
        onSubmit={() => ""}
      >
        <FieldSetGeneral />
        <FieldSetStructures />
      </FormWrapper>
    </>
  );
}
