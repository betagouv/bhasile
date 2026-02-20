"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

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
import { CpomFormType, cpomSchema } from "@/schemas/forms/base/cpom.schema";
import { CpomGranularity } from "@/types/cpom.type";
import { FetchState } from "@/types/fetch-state.type";
import { ActeAdministratifCategoryType } from "@/types/file-upload.type";

export default function CpomAjoutIdentification() {
  const router = useRouter();

  const { addCpom } = useCpom();

  const defaultValues = {
    name: "",
    region: "",
    departements: [],
    granularity: "DEPARTEMENTALE" as CpomGranularity,
    dateStart: "",
    dateEnd: "",
    operateur: { name: "", id: undefined },
    structures: [],
    cpomMillesimes: [],
    actesAdministratifs: [
      {
        uuid: uuidv4(),
        category: "CPOM" as ActeAdministratifCategoryType,
      },
    ],
  };

  const { getFetchState, setFetchState } = useFetchState();
  const saveState = getFetchState("cpom-save");

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );

  const handleSubmit = async (data: CpomFormType) => {
    setFetchState("cpom-save", FetchState.LOADING);

    const result = await addCpom(data);
    if (typeof result === "object" && "cpomId" in result) {
      setFetchState("cpom-save", FetchState.IDLE);
      router.push(
        `/cpoms/${result.cpomId}/modification/02-finance?isCreation=true`
      );
    } else {
      setFetchState("cpom-save", FetchState.ERROR);
      setBackendError(result);
      console.error(result);
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
        <FieldSetDocuments />
        <FieldSetStructures />
        {saveState === FetchState.ERROR && (
          <SubmitError structureDnaCode={""} backendError={backendError} />
        )}
      </FormWrapper>
    </>
  );
}
