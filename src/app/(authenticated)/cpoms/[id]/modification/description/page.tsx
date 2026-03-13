"use client";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { FieldSetGeneral } from "@/app/components/forms/fieldsets/cpom/FieldSetGeneral";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { descriptionCpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationDescription() {
  const { cpom } = useCpomContext();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("cpom-save");

  const { handleSubmit, backendError } = useCpomFormHandling({
    cpomId: cpom.id,
    nextRoute: `/cpoms/${cpom.id}`,
  });

  if (!cpom) {
    return null;
  }

  const defaultValues = getCpomDefaultValues(cpom);

  return (
    <>
      <ModificationTitle step="Description" closeLink={`/cpoms/${cpom.id}`} />{" "}
      <FormWrapper
        schema={descriptionCpomSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        resetRoute={`/cpoms/${cpom.id}`}
        submitButtonText="Valider"
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <CustomNotice
          severity="info"
          title=""
          description="Les dates de début et de fin du CPOM se modifient dans le bloc “Documents”."
        />
        <FieldSetGeneral />
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
