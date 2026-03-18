"use client";

import { FieldSetStructures } from "@/app/components/forms/cpom/FieldSetStructures";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { compositionCpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationComposition() {
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
      <ModificationTitle step="Composition" closeLink={`/cpoms/${cpom.id}`} />{" "}
      <FormWrapper
        schema={compositionCpomSchema}
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
        <FieldSetStructures formKind={FormKind.MODIFICATION} />
        {saveState === FetchState.ERROR && (
          <SubmitError cpomId={cpom.id} backendError={backendError} />
        )}
      </FormWrapper>
    </>
  );
}
