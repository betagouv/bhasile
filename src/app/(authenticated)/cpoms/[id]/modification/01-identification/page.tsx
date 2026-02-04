"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";

import { FieldSetDocuments } from "@/app/components/forms/fieldsets/cpom/FieldSetDocuments";
import { FieldSetGeneral } from "@/app/components/forms/fieldsets/cpom/FieldSetGeneral";
import { FieldSetStructures } from "@/app/components/forms/fieldsets/cpom/FieldSetStructures";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useCpom } from "@/app/hooks/useCpom";
import { CpomFormValues, cpomSchema } from "@/schemas/forms/base/cpom.schema";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationIdentification() {
  const router = useRouter();

  const { cpom, setCpom } = useCpomContext();

  const { updateCpom } = useCpom();

  const handleSubmit = async (data: CpomFormValues) => {
    const result = await updateCpom(data, setCpom);
    if (typeof result === "object" && "cpomId" in result) {
      router.push(`/cpoms/${result.cpomId}/modification/02-finance`);
    } else {
      console.error(result);
    }
  };

  console.log(cpom);
  if (!cpom) {
    return null;
  }

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
        defaultValues={cpom}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <FieldSetGeneral />
        <FieldSetDocuments />
        <FieldSetStructures />
      </FormWrapper>
    </>
  );
}
