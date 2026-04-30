"use client";

import { useState } from "react";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { FieldSetGeneral } from "@/app/components/forms/cpom/FieldSetGeneral";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
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
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getCpomDefaultValues(cpom);

  return (
    <>
      <ModificationTitle
        step="Description"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={descriptionCpomSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <CustomNotice
          severity="info"
          title=""
          description="Les dates de début et de fin du CPOM se modifient dans le bloc “Document de convention du CPOM”."
        />
        <FieldSetGeneral />
        {saveState === FetchState.ERROR && (
          <SubmitError cpomId={cpom.id} backendError={backendError} />
        )}
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/cpoms/${cpom.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
