"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FieldSetFinances } from "@/app/components/forms/fieldsets/cpom/FieldSetFinances";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useCpom } from "@/app/hooks/useCpom";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { CpomFormValues, cpomSchema } from "@/schemas/forms/base/cpom.schema";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationIdentification() {
  const router = useRouter();

  const { cpom, setCpom } = useCpomContext();

  const { updateCpom } = useCpom();

  const handleSubmit = async (data: CpomFormValues) => {
    const result = await updateCpom(data, setCpom);
    console.log(result);
  };

  const defaultValues = getCpomDefaultValues(cpom);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      router.push(`/cpom/${cpom.id}/modification/01-identification`);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, cpom?.id]);

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
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <FieldSetFinances />
      </FormWrapper>
    </>
  );
}
