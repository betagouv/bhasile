"use client";

import { FieldSetActesAdministratifs } from "@/app/components/forms/fieldsets/cpom/FieldSetActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { actesAdministratifsCpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationActesAdministratifs() {
  const { cpom } = useCpomContext();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("cpom-save");

  const { handleSubmit, backendError } = useCpomFormHandling({
    cpomId: cpom.id,
    nextRoute: `/cpoms/${cpom.id}`,
  });

  const defaultValues = getCpomDefaultValues(cpom);

  return (
    <>
      <ModificationTitle
        step="Actes administratifs"
        closeLink={`/cpoms/${cpom.id}`}
      />
      <FormWrapper
        schema={actesAdministratifsCpomSchema}
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
        <FieldSetActesAdministratifs formKind={FormKind.MODIFICATION} />
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
