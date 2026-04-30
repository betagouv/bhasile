"use client";

import { useState } from "react";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { FieldSetCalendrier } from "@/app/components/forms/calendrier/FieldSetCalendrier";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { calendrierSchema } from "@/schemas/forms/base/calendrier.schema";
import { FetchState } from "@/types/fetch-state.type";

export default function ModificationCalendrier() {
  const { structure } = useStructureContext();

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getDefaultValues({ structure });

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <>
      <ModificationTitle
        step="Calendrier"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={calendrierSchema}
        defaultValues={defaultValues}
        onSubmit={(data) =>
          handleSubmit({
            ...data,
            id: structure.id,
          })
        }
        mode="onChange"
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <FieldSetCalendrier />
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/structures/${structure.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
      {saveState === FetchState.ERROR && (
        <SubmitError
          codeBhasile={structure.codeBhasile}
          backendError={backendError}
        />
      )}
    </>
  );
}
