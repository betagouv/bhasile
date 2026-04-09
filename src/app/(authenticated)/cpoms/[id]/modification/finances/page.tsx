"use client";

import { CpomTables } from "@/app/components/forms/finance/budget-tables/CpomTables";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { financesCpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationFinance() {
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
      <ModificationTitle step="Finances" closeLink={`/cpoms/${cpom.id}`} />{" "}
      <FormWrapper
        schema={financesCpomSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        resetRoute={`/cpoms/${cpom.id}`}
        submitButtonText="Valider"
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france) gap-10"
      >
        <CpomTables />
        {saveState === FetchState.ERROR && (
          <SubmitError cpomId={cpom.id} backendError={backendError} />
        )}
      </FormWrapper>
    </>
  );
}
