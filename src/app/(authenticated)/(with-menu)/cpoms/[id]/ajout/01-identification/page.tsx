"use client";

import Stepper from "@codegouvfr/react-dsfr/Stepper";

import { FieldSetActesAdministratifs } from "@/app/components/forms/cpom/FieldSetActesAdministratifs";
import { FieldSetGeneral } from "@/app/components/forms/cpom/FieldSetGeneral";
import { FieldSetStructures } from "@/app/components/forms/cpom/FieldSetStructures";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { PreviousPageLink } from "@/app/components/forms/PreviousPageLink";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { cpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomAjoutIdentification() {
  const { cpom } = useCpomContext();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("cpom-save");

  const { handleSubmit, backendError } = useCpomFormHandling({
    cpomId: cpom.id,
    nextRoute: `/cpoms/${cpom.id}/ajout/02-finances`,
  });

  const defaultValues = getCpomDefaultValues(cpom);

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
        <PreviousPageLink previousRoute="" />

        <FieldSetGeneral />
        <FieldSetActesAdministratifs />
        <FieldSetStructures />
        {saveState === FetchState.ERROR && (
          <SubmitError cpomId={cpom.id} backendError={backendError} />
        )}
      </FormWrapper>
    </>
  );
}
