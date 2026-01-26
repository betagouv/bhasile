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
      id: 1,
      name: "Opérateur 1",
    },
    granularity: CpomGranularity.DEPARTEMENTALE,
    departements: [1, 3, 7, 15, 26, 38, 42, 43, 63, 69, 73, 74],
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
