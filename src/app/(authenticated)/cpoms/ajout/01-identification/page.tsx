"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { FieldSetDocuments } from "@/app/components/forms/fieldsets/cpom/FieldSetDocuments";
import { FieldSetGeneral } from "@/app/components/forms/fieldsets/cpom/FieldSetGeneral";
import { FieldSetStructures } from "@/app/components/forms/fieldsets/cpom/FieldSetStructures";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { PreviousPageLink } from "@/app/components/forms/PreviousPageLink";
import { useCpom } from "@/app/hooks/useCpom";
import { CpomFormValues, cpomSchema } from "@/schemas/forms/base/cpom.schema";
import { CpomGranularity } from "@/types/cpom.type";

export default function CpomAjoutIdentification() {
  const router = useRouter();

  const { addCpom } = useCpom();

  const defaultValues = {
    name: "",
    structures: [],
    dateStart: undefined,
    dateEnd: undefined,
    operateur: {
      id: 1,
      name: "Opérateur 1",
    },
    granularity: CpomGranularity.DEPARTEMENTALE,
    departements: [25, 26],
    actesAdministratifs: [{ uuid: uuidv4(), category: "CPOM" as const }],
  };

  const handleSubmit = async (data: CpomFormValues) => {
    const result = await addCpom(data);
    if (typeof result === "object" && "cpomId" in result) {
      router.push(`/cpoms/${result.cpomId}/modification/02-finance`);
    } else {
      console.error(result);
    }
  };

  return (
    <>
      <Stepper
        currentStep={1}
        nextTitle="Analyse financière"
        stepCount={2}
        title="Identification du cpom"
      />
      <FormWrapper
        schema={cpomSchema}
        defaultValues={defaultValues}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <PreviousPageLink previousRoute="" />
        <FieldSetGeneral />
        <FieldSetDocuments />
        <FieldSetStructures />
      </FormWrapper>
    </>
  );
}
