"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";

import { FieldSetGeneral } from "@/app/components/forms/fieldsets/cpom/FieldSetGeneral";
import { FieldSetStructures } from "@/app/components/forms/fieldsets/cpom/FieldSetStructures";
import FormWrapper from "@/app/components/forms/FormWrapper";
import { useCpom } from "@/app/hooks/useCpom";
import {
  CpomIdentificationFormValues,
  cpomIdentificationSchema,
} from "@/schemas/forms/cpom/cpomIdentification.schema";
import { CpomGranularity } from "@/types/cpom.type";

export default function CpomAjoutIdentification() {
  const router = useRouter();

  const { addCpom } = useCpom();

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

  const handleSubmit = async (data: CpomIdentificationFormValues) => {
    const result = await addCpom(data);
    if (typeof result === "object" && "cpomId" in result) {
      router.push(`/cpom/${result.cpomId}/modification/02-finance`);
    } else {
      console.error(result);
    }
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
        schema={cpomIdentificationSchema}
        defaultValues={defaultValues}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
      >
        <FieldSetGeneral />
        <FieldSetStructures />
      </FormWrapper>
    </>
  );
}
