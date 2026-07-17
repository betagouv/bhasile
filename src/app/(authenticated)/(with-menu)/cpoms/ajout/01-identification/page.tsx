"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";

import { FieldSetActesAdministratifs } from "@/app/components/forms/cpom/FieldSetActesAdministratifs";
import { FieldSetGeneral } from "@/app/components/forms/cpom/FieldSetGeneral";
import { FieldSetStructures } from "@/app/components/forms/cpom/FieldSetStructures";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { PreviousPageLink } from "@/app/components/forms/PreviousPageLink";
import { useCpom } from "@/app/hooks/useCpom";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { CpomFormValues, cpomSchema } from "@/schemas/forms/base/cpom.schema";

export default function CpomAjoutIdentification() {
  const router = useRouter();

  const { addCpom } = useCpom();

  const defaultValues = getCpomDefaultValues();

  const handleSubmit = async (data: CpomFormValues) => {
    try {
      const cpomId = await addCpom(data);
      router.push(`/cpoms/${cpomId}/ajout/02-finances`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Stepper
        currentStep={1}
        nextTitle="Analyse financière"
        stepCount={2}
        title="Identification du CPOM"
        className="w-1/2"
      />
      <FormWrapper
        schema={cpomSchema}
        defaultValues={defaultValues}
        submitButtonText="Étape suivante"
        onSubmit={handleSubmit}
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <PreviousPageLink />
        <FieldSetGeneral />
        <FieldSetActesAdministratifs structureTypes={[]} />
        <FieldSetStructures />
      </FormWrapper>
    </>
  );
}
