"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FieldSetDocuments } from "@/app/components/forms/fieldsets/cpom/FieldSetDocuments";
import { FieldSetGeneral } from "@/app/components/forms/fieldsets/cpom/FieldSetGeneral";
import { FieldSetStructures } from "@/app/components/forms/fieldsets/cpom/FieldSetStructures";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { PreviousPageLink } from "@/app/components/forms/PreviousPageLink";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useCpom } from "@/app/hooks/useCpom";
import { CpomFormValues, cpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationIdentification() {
  const router = useRouter();

  const { cpom, setCpom } = useCpomContext();

  const { updateCpom } = useCpom();

  const { getFetchState, setFetchState } = useFetchState();
  const saveState = getFetchState("cpom-save");

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );

  const handleSubmit = async (data: CpomFormValues) => {
    setFetchState("cpom-save", FetchState.LOADING);
    const result = await updateCpom(data, setCpom);
    if (typeof result === "object" && "cpomId" in result) {
      setFetchState("cpom-save", FetchState.IDLE);
      router.push(`/cpoms/${result.cpomId}/modification/02-finance`);
    } else {
      setFetchState("cpom-save", FetchState.ERROR);
      setBackendError(result);
      console.error(result);
    }
  };

  if (!cpom) {
    return null;
  }

  console.log("saveState", saveState);

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
        <PreviousPageLink previousRoute="" />

        <FieldSetGeneral />
        <FieldSetDocuments />
        <FieldSetStructures />
        {saveState === FetchState.ERROR && (
          <SubmitError
            structureDnaCode={String(cpom.id)}
            backendError={backendError}
          />
        )}
      </FormWrapper>
    </>
  );
}
